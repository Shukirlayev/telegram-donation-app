import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Telegraf, Markup } from "telegraf";
import { createServer as createViteServer } from "vite";
import cron from "node-cron";
import * as dotenv from "dotenv";
import fs from "fs";

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Initialize Firebase Admin
const adminApp = initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId
});
const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

type Goal = {
  id: string;
  userId: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  createdAt: string;
  deadline?: string;
  isArchived?: boolean;
  isCompleted?: boolean;
};

type Transaction = {
  id: string;
  userId: number;
  goalId: string;
  amount: number;
  note: string;
  createdAt: string;
};

type UserProfile = {
  userId: number;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramPhotoUrl?: string;
  displayName?: string;
  preferredCurrency?: string;
};

// Initialize Telegraf bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

let bot: Telegraf | null = null;

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply(
      "👋 Salom! Maqsadlar va tejashlar botiga xush kelibsiz.\n\n" +
      "Avval *Mini App* orqali o'z maqsadingizni (kategoriyalarni) yarating. " +
      "Keyin esa, menga summani yozib yuboring (masalan: `50000 noutbuk`).",
      { parse_mode: "Markdown" }
    );
  });

  bot.command('admin', async (ctx) => {
    const adminIdStr = process.env.ADMIN_TELEGRAM_ID;
    const tempPassword = "sarvar_admin";
    
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const args = ctx.message.text.split(' ');

    if ((adminIdStr && ctx.from.id.toString() === adminIdStr) || args[1] === tempPassword) {
      const snapUsers = await db.collection('users').get();
      const snapGoals = await db.collection('goals').get();
      const snapTx = await db.collection('transactions').get();

      const totalUsers = snapUsers.size;
      const totalGoals = snapGoals.size;
      let activeGoalsCount = 0;
      let totalSavingsUZS = 0;
      snapGoals.forEach(doc => {
        const g = doc.data() as Goal;
        if (!g.isArchived) activeGoalsCount++;
        totalSavingsUZS += g.currentAmount;
      });

      const totalTx = snapTx.size;
      const activeUsersSet = new Set<number>();
      snapTx.forEach(doc => {
        activeUsersSet.add((doc.data() as Transaction).userId);
      });
      const activeUsers = activeUsersSet.size;

      const msg = `📊 *Admin Panel (Statistika)*\n\n` +
        `👥 Jami foydalanuvchilar: ${totalUsers} ta\n` +
        `🔥 Pul yig'ayotganlar (Aktiv): ${activeUsers} ta\n` +
        `🎯 Jami maqsadlar: ${totalGoals} ta (${activeGoalsCount} ta aktiv)\n` +
        `💳 Jami tranzaksiyalar: ${totalTx} ta\n` +
        `💰 Barcha yig'ilgan mablag': ${totalSavingsUZS.toLocaleString()} UZS`;

      return ctx.reply(msg, { parse_mode: "Markdown" });
    } else {
      return; 
    }
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    
    const goalsSnap = await db.collection('goals').where('userId', '==', userId).get();
    let allUserGoals = goalsSnap.docs.map(d => d.data() as Goal);
    
    const userGoals = allUserGoals.filter(g => !g.isCompleted && g.currentAmount < g.targetAmount && !g.isArchived);

    if (userGoals.length === 0) {
      return ctx.reply("Sizda hali ochiq (tugallanmagan) maqsadlar yo'q! 🎯\nIltimos, avval Mini App orqali yangi maqsad (kategoriya) qo'shing.");
    }

    const userProfileDoc = await db.collection('users').doc(String(userId)).get();
    const userProfile = userProfileDoc.exists ? (userProfileDoc.data() as UserProfile) : undefined;
    const currency = userProfile?.preferredCurrency || "UZS";
    const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : currency === 'RUB' ? 140 : 1;

    // Try very strict match for quick entry (only digits)
    if (/^\d+$/.test(text)) {
      const amount = parseInt(text, 10);
      const buttons = userGoals.map(g => [Markup.button.callback(g.title, `add_${amount}_${g.id}`)]);
      return ctx.reply(`💳 ${amount.toLocaleString()} ${currency} yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, Markup.inlineKeyboard(buttons));
    }

    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
       const greetings = ["salom", "qalay", "qanaqa", "yaxshimisiz", "assalom", "hayit", "bayram"];
       const textLower = text.toLowerCase();
       const isGreeting = greetings.some(w => textLower.includes(w));
       
       if (isGreeting) {
           return ctx.reply("Assalomu alaykum! Kayfiyatlar yaxshimi? 😊\n\nMen sizning shaxsiy moliyaviy yordamchingizman. Maqsadlaringiz sari pul yig'ishda yordam beraman. Menga shunchaki summani yozing (masalan: 50000 noutbuk).");
       }
       return ctx.reply("Kechirasiz, gapingizdan summani topa olmadim. 🧐\n\nIltimos, pul qo'shish uchun raqamlardan foydalaning (masalan: 50000 noutbuk). Yoki Mini App orqali maqsadlaringizni boshqaring!");
    }

    const amount = parseInt(amountMatch[0], 10);
    const note = text.replace(amountMatch[0], '').trim().toLowerCase();
    let matchedGoal = null;
    if (note.length > 2) {
       const cleanNote = note.replace('uchun', '').replace('ga', '').trim();
       matchedGoal = userGoals.find(g => cleanNote.includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(cleanNote));
    }
    
    if (matchedGoal) {
       const baseAmount = amount * rate;
       matchedGoal.currentAmount += baseAmount;
       
       const txId = crypto.randomUUID();
       const newTx: Transaction = { id: txId, userId, goalId: matchedGoal.id, amount: baseAmount, note: text, createdAt: new Date().toISOString() };
       
       const batch = db.batch();
       batch.update(db.collection('goals').doc(matchedGoal.id), { currentAmount: matchedGoal.currentAmount });
       batch.set(db.collection('transactions').doc(txId), newTx);
       await batch.commit();

       let message = `✅ ${amount.toLocaleString()} ${currency} "${matchedGoal.title}" maqsadiga qo'shildi!\n\nJami yig'ildi: ${(matchedGoal.currentAmount / rate).toLocaleString()} / ${matchedGoal.targetAmount ? (matchedGoal.targetAmount / rate).toLocaleString() : 'N/A'} ${currency}`;
       if (matchedGoal.currentAmount >= (matchedGoal.targetAmount || 0)) message += `\n\n🎉 Tabriklaymiz! Siz "${matchedGoal.title}" uchun yetarli pul yig'dingiz!`;
       return ctx.reply(message);
    }
    const buttons = userGoals.map(g => [Markup.button.callback(g.title, `add_${amount}_${g.id}`)]);
    return ctx.reply(`💳 ${amount.toLocaleString()} ${currency} yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, Markup.inlineKeyboard(buttons));
  });

  bot.action(/^add_(\d+)_([A-Za-z0-9\-]+)$/, async (ctx) => {
    const amount = parseInt(ctx.match[1], 10);
    const goalId = ctx.match[2];
    const userId = ctx.from?.id;

    if (!userId) return;

    const userProfileDoc = await db.collection('users').doc(String(userId)).get();
    const userProfile = userProfileDoc.exists ? (userProfileDoc.data() as UserProfile) : undefined;
    const currency = userProfile?.preferredCurrency || "UZS";
    const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : currency === 'RUB' ? 140 : 1;

    const goalDoc = await db.collection('goals').doc(goalId).get();
    if (!goalDoc.exists) {
      return ctx.answerCbQuery("❌ Kechirasiz, maqsad topilmadi.");
    }
    const goal = goalDoc.data() as Goal;
    if (goal.userId !== userId) {
      return ctx.answerCbQuery("❌ Ruxsat yo'q.");
    }
    
    if (goal.isCompleted || goal.currentAmount >= goal.targetAmount) {
      return ctx.answerCbQuery("❌ Kechirasiz, bu maqsad allaqachon yakunlangan.", { show_alert: true });
    }

    // Process transaction
    const baseAmount = amount * rate;
    goal.currentAmount += baseAmount;
    
    const txId = crypto.randomUUID();
    const newTx: Transaction = {
      id: txId,
      userId,
      goalId: goal.id,
      amount: baseAmount,
      note: 'Bot orqali tanlandi',
      createdAt: new Date().toISOString(),
    };

    const batch = db.batch();
    batch.update(db.collection('goals').doc(goalId), { currentAmount: goal.currentAmount });
    batch.set(db.collection('transactions').doc(txId), newTx);
    await batch.commit();

    await ctx.answerCbQuery("✅ Saqlandi!");
    
    let message = `✅ ${amount.toLocaleString()} ${currency} "${goal.title}" maqsadiga qo'shildi!\n\n` +
      `Jami yig'ildi: ${(goal.currentAmount / rate).toLocaleString()} / ${goal.targetAmount ? (goal.targetAmount / rate).toLocaleString() : 'N/A'} ${currency}`;
    
    if (goal.currentAmount >= (goal.targetAmount || 0)) {
      message += `\n\n🎉 Tabriklaymiz! Siz "${goal.title}" uchun yetarli pul yig'dingiz!`;
    }

    await ctx.editMessageText(message);
  });

  bot.launch().catch(console.error);

  // Cron Job
  cron.schedule("0 10 * * *", async () => {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    const usersSnap = await db.collection('users').get();
    
    for (const doc of usersSnap.docs) {
      const user = doc.data() as UserProfile;
      const txsSnap = await db.collection('transactions')
        .where('userId', '==', user.userId)
        .get();
        
      if (!txsSnap.empty) {
        const userTxs = txsSnap.docs.map(d => d.data() as Transaction);
        userTxs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const lastTx = userTxs[0];
        if (new Date(lastTx.createdAt) < threeDaysAgo) {
          bot?.telegram.sendMessage(
            user.userId,
            `Salom ${user.displayName}! O'z maqsadlaringiz sari pul ajratishni unutmang. Botga summani yuboring! 🎯`
          ).catch(e => console.error("Could not send reminder:", e));
        }
      }
    }
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
} else {
  console.warn("TELEGRAM_BOT_TOKEN is not set in environment variables. Telegram Bot will not run.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/telegram", async (req, res) => {
    const { initData } = req.body;
    if (!initData || !BOT_TOKEN) {
      res.status(401).json({ error: "Missing initData or Bot Token not configured" });
      return;
    }

    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get("hash");
      urlParams.delete("hash");

      if (!hash) {
         res.status(400).json({ error: "No hash provided in initData" });
         return;
      }

      // Sort keys alphabetically
      const keys = Array.from(urlParams.keys()).sort();
      const dataCheckString = keys.map(k => `${k}=${urlParams.get(k)}`).join("\n");

      // Verify HMAC-SHA256
      const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
      const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

      if (computedHash !== hash) {
         res.status(401).json({ error: "Invalid signature" });
         return;
      }

      const userStr = urlParams.get("user");
      if (!userStr) {
         res.status(401).json({ error: "No user object found in initData" });
         return;
      }

      const user = JSON.parse(userStr);
      
      const userRef = db.collection('users').doc(String(user.id));
      const userDoc = await userRef.get();
      
      let userProfile: UserProfile;
      if (!userDoc.exists) {
        userProfile = {
          userId: user.id,
          telegramUsername: user.username,
          telegramFirstName: user.first_name,
          telegramLastName: user.last_name,
          telegramPhotoUrl: user.photo_url,
          displayName: user.first_name || user.username || "Foydalanuvchi",
        };
        await userRef.set(userProfile);
      } else {
        userProfile = userDoc.data() as UserProfile;
        await userRef.update({
          telegramUsername: user.username || null,
          telegramFirstName: user.first_name || null,
          telegramLastName: user.last_name || null,
          telegramPhotoUrl: user.photo_url || null,
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, userId: user.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error during auth" });
    }
  });

  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err || !decoded) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      (req as Record<string, any>).user = decoded;
      next();
    });
  };

  // 2. Main data endpoint: returns goals and recent transactions
  app.get("/api/data", authMiddleware, async (req, res) => {
    const userId = (req as any).user.userId;
    try {
      const goalsSnap = await db.collection("goals").where("userId", "==", userId).get();
      const userGoals = goalsSnap.docs.map(d => d.data() as Goal).filter(g => !g.isArchived);

      const txsSnap = await db.collection("transactions").where("userId", "==", userId).get();
      const userTransactions = txsSnap.docs
        .map(d => d.data() as Transaction)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

      const userProfileDoc = await db.collection("users").doc(String(userId)).get();
      const userProfile = userProfileDoc.exists ? userProfileDoc.data() : undefined;

      res.json({ 
        goals: userGoals, 
        transactions: userTransactions,
        profile: userProfile
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  // 3. Create Goal
  app.post("/api/goals", authMiddleware, async (req, res) => {
    const userId = (req as any).user.userId;
    const { title, targetAmount, color, deadline } = req.body;

    if (!title || !targetAmount) {
      return res.status(400).json({ error: "Missing title or target amount" });
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      userId,
      title,
      targetAmount: parseInt(targetAmount, 10),
      currentAmount: 0,
      color: color || "#3b82f6",
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
      isArchived: false,
      isCompleted: false
    };

    try {
      await db.collection("goals").doc(newGoal.id).set(newGoal);
      res.json(newGoal);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  // 3a. Update Goal
  app.put("/api/goals/:id", authMiddleware, async (req, res) => {
    const userId = (req as any).user.userId;
    const { title, targetAmount, color, deadline, isCompleted } = req.body;
    const goalId = req.params.id;

    try {
      const goalRef = db.collection("goals").doc(goalId);
      const goalDoc = await goalRef.get();
      if (!goalDoc.exists || (goalDoc.data() as Goal).userId !== userId) {
        return res.status(404).json({ error: "Goal not found" });
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (targetAmount) updates.targetAmount = parseInt(targetAmount, 10);
      if (color) updates.color = color;
      if (deadline !== undefined) updates.deadline = deadline;
      if (isCompleted !== undefined) updates.isCompleted = isCompleted;

      await goalRef.update(updates);
      const updatedGoal = (await goalRef.get()).data();
      res.json(updatedGoal);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  // 3b. Delete/Archive Goal
  app.delete("/api/goals/:id", authMiddleware, async (req, res) => {
    const userId = (req as any).user.userId;
    const goalId = req.params.id;

    try {
      const goalRef = db.collection("goals").doc(goalId);
      const goalDoc = await goalRef.get();
      if (!goalDoc.exists || (goalDoc.data() as Goal).userId !== userId) {
        return res.status(404).json({ error: "Goal not found" });
      }

      await goalRef.delete();
      
      const txsSnap = await db.collection("transactions")
        .where("goalId", "==", goalId)
        .where("userId", "==", userId)
        .get();

      const batch = db.batch();
      txsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // 4. Update Profile
  app.put("/api/user/profile", authMiddleware, async (req, res) => {
    const userId = (req as any).user.userId;
    const { displayName, preferredCurrency } = req.body;
    
    try {
      const userRef = db.collection("users").doc(String(userId));
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const updates: any = {};
      if (displayName) updates.displayName = displayName;
      if (preferredCurrency) updates.preferredCurrency = preferredCurrency;

      await userRef.update(updates);
      const updatedUser = (await userRef.get()).data();
      res.json({ profile: updatedUser });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
