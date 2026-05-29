import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Telegraf, Markup } from "telegraf";
import { createServer as createViteServer } from "vite";
import cron from "node-cron";
import * as dotenv from "dotenv";

dotenv.config();

// In-memory simple database
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

const goals: Goal[] = [];
const transactions: Transaction[] = [];
const users: UserProfile[] = [];

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
    const args = ctx.message.text.split(' ');

    if ((adminIdStr && ctx.from.id.toString() === adminIdStr) || args[1] === tempPassword) {
      const activeUsers = new Set(transactions.map(t => t.userId)).size;
      const totalUsers = users.length;
      const totalGoals = goals.length;
      const activeGoals = goals.filter(g => !g.isArchived).length;
      const totalTx = transactions.length;
      
      let totalSavingsUZS = 0;
      goals.forEach(g => {
         totalSavingsUZS += g.currentAmount;
      });

      const msg = `📊 *Admin Panel (Statistika)*\n\n` +
        `👥 Jami foydalanuvchilar: ${totalUsers} ta\n` +
        `🔥 Pul yig'ayotganlar (Aktiv): ${activeUsers} ta\n` +
        `🎯 Jami maqsadlar: ${totalGoals} ta (${activeGoals} ta aktiv)\n` +
        `💳 Jami tranzaksiyalar: ${totalTx} ta\n` +
        `💰 Barcha yig'ilgan mablag': ${totalSavingsUZS.toLocaleString()} UZS`;

      return ctx.reply(msg, { parse_mode: "Markdown" });
    } else {
      return; // Do nothing for unauthorized users to keep it hidden
    }
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    
    const userGoals = goals.filter(g => g.userId === userId && !g.isArchived);

    if (userGoals.length === 0) {
      return ctx.reply("Sizda hali maqsadlar yo'q! 🎯\nIltimos, avval Mini App orqali yangi maqsad (kategoriya) qo'shing.");
    }

    const userProfile = users.find(u => u.userId === userId);
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
       // Conversational fallback without AI
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
       transactions.push({ id: crypto.randomUUID(), userId, goalId: matchedGoal.id, amount: baseAmount, note: text, createdAt: new Date().toISOString() });
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

    const userProfile = users.find(u => u.userId === userId);
    const currency = userProfile?.preferredCurrency || "UZS";
    const rate = currency === 'UZS' ? 1 : currency === 'USD' ? 12500 : currency === 'EUR' ? 13500 : currency === 'RUB' ? 140 : 1;

    const goal = goals.find(g => g.id === goalId && g.userId === userId);
    if (!goal) {
      return ctx.answerCbQuery("❌ Kechirasiz, maqsad topilmadi.");
    }

    // Process transaction
    const baseAmount = amount * rate;
    goal.currentAmount += baseAmount;
    transactions.push({
      id: crypto.randomUUID(),
      userId,
      goalId: goal.id,
      amount: baseAmount,
      note: 'Bot orqali tanlandi',
      createdAt: new Date().toISOString(),
    });

    await ctx.answerCbQuery("✅ Saqlandi!");
    
    let message = `✅ ${amount.toLocaleString()} ${currency} "${goal.title}" maqsadiga qo'shildi!\n\n` +
      `Jami yig'ildi: ${(goal.currentAmount / rate).toLocaleString()} / ${goal.targetAmount ? (goal.targetAmount / rate).toLocaleString() : 'N/A'} ${currency}`;
    
    if (goal.currentAmount >= (goal.targetAmount || 0)) {
      message += `\n\n🎉 Tabriklaymiz! Siz "${goal.title}" uchun yetarli pul yig'dingiz!`;
    }

    await ctx.editMessageText(message);
  });

  bot.launch().catch(console.error);

  // Cron Job: If user hasn't added a transaction in 3 days, send a reminder.
  // Run every day at 10:00 (server time)
  cron.schedule("0 10 * * *", () => {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    for (const user of users) {
      const userTxs = transactions.filter(t => t.userId === user.userId);
      if (userTxs.length > 0) {
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
  
  // 1. Auth via Telegram WebApp initData
  app.post("/api/auth/telegram", (req, res) => {
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
      
      let userProfile = users.find(u => u.userId === user.id);
      if (!userProfile) {
        userProfile = {
          userId: user.id,
          telegramUsername: user.username,
          telegramFirstName: user.first_name,
          telegramLastName: user.last_name,
          telegramPhotoUrl: user.photo_url,
          displayName: user.first_name || user.username || "Foydalanuvchi",
        };
        users.push(userProfile);
      } else {
        userProfile.telegramUsername = user.username;
        userProfile.telegramFirstName = user.first_name;
        userProfile.telegramLastName = user.last_name;
        userProfile.telegramPhotoUrl = user.photo_url;
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
      (req as any).user = decoded;
      next();
    });
  };

  // 2. Main data endpoint: returns goals and recent transactions
  app.get("/api/data", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const userGoals = goals.filter(g => g.userId === userId && !g.isArchived);
    const userTransactions = transactions.filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50); // top 50 recent transactions
      
    const userProfile = users.find(u => u.userId === userId);

    res.json({ 
      goals: userGoals, 
      transactions: userTransactions,
      profile: userProfile
    });
  });

  // 3. Create Goal
  app.post("/api/goals", authMiddleware, (req, res) => {
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
      deadline: deadline || undefined
    };

    goals.push(newGoal);
    res.json(newGoal);
  });

  // 3a. Update Goal
  app.put("/api/goals/:id", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const { title, targetAmount, color, deadline } = req.body;
    const goalId = req.params.id;

    const goal = goals.find(g => g.id === goalId && g.userId === userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (title) goal.title = title;
    if (targetAmount) goal.targetAmount = parseInt(targetAmount, 10);
    if (color) goal.color = color;
    if (deadline !== undefined) goal.deadline = deadline;

    res.json(goal);
  });

  // 3b. Delete/Archive Goal
  app.delete("/api/goals/:id", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const goalId = req.params.id;

    const goal = goals.find(g => g.id === goalId && g.userId === userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    goal.isArchived = true;
    res.json({ success: true });
  });

  // 4. Update Profile
  app.put("/api/user/profile", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const { displayName, preferredCurrency } = req.body;
    
    const userProfile = users.find(u => u.userId === userId);
    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    if (displayName) userProfile.displayName = displayName;
    if (preferredCurrency) userProfile.preferredCurrency = preferredCurrency;
    res.json({ profile: userProfile });
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
