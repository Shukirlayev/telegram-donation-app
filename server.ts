import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Telegraf, Markup } from "telegraf";
import { createServer as createViteServer } from "vite";
import cron from "node-cron";
import * as dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

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
};

const goals: Goal[] = [];
const transactions: Transaction[] = [];
const users: UserProfile[] = [];

// Initialize Telegraf bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

let bot: Telegraf | null = null;

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply(
      "👋 Salom! Maqsadlar va tejashlar botiga xush kelibsiz.\n\n" +
      "Avval *Mini App* orqali o'z maqsadingizni (kategoriyalarni) yarating. " +
      "Keyin esa, menga summani yoki maqsadingiz haqida gapirib bering (masalan: `50000 noutbuk` yoki `Bugun mashina uchun 100 ming yig'dim`).",
      { parse_mode: "Markdown" }
    );
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    
    const userGoals = goals.filter(g => g.userId === userId && !g.isArchived);

    if (userGoals.length === 0) {
      return ctx.reply("Sizda hali maqsadlar yo'q! 🎯\nIltimos, avval Mini App orqali yangi maqsad (kategoriya) qo'shing.");
    }

    // Try very strict match for quick entry (only digits)
    if (/^\d+$/.test(text)) {
      const amount = parseInt(text, 10);
      const buttons = userGoals.map(g => [Markup.button.callback(g.title, `add_${amount}_${g.id}`)]);
      return ctx.reply(`💳 ${amount.toLocaleString()} UZS yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, Markup.inlineKeyboard(buttons));
    }

    // Attempt Gemini parsing for natural language
    if (!ai) {
       // Fallback to old behavior
       const amountMatch = text.match(/\d+/);
       if (!amountMatch) {
         return ctx.reply("Iltimos, kiritmoqchi bo'lgan summangizni yozing (masalan: 50000 noutbuk).");
       }
       const amount = parseInt(amountMatch[0], 10);
       const note = text.replace(amountMatch[0], '').trim().toLowerCase();
       let matchedGoal = null;
       if (note.length > 2) {
         const cleanNote = note.replace('uchun', '').replace('ga', '').trim();
         matchedGoal = userGoals.find(g => cleanNote.includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(cleanNote));
       }
       if (matchedGoal) {
         matchedGoal.currentAmount += amount;
         transactions.push({ id: crypto.randomUUID(), userId, goalId: matchedGoal.id, amount, note: text, createdAt: new Date().toISOString() });
         let message = `✅ ${amount.toLocaleString()} UZS "${matchedGoal.title}" maqsadiga qo'shildi!\n\nJami yig'ildi: ${matchedGoal.currentAmount.toLocaleString()} / ${matchedGoal.targetAmount ? matchedGoal.targetAmount.toLocaleString() : 'N/A'} UZS`;
         if (matchedGoal.currentAmount >= matchedGoal.targetAmount) message += `\n\n🎉 Tabriklaymiz! Siz "${matchedGoal.title}" uchun yetarli pul yig'dingiz!`;
         return ctx.reply(message);
       }
       const buttons = userGoals.map(g => [Markup.button.callback(g.title, `add_${amount}_${g.id}`)]);
       return ctx.reply(`💳 ${amount.toLocaleString()} UZS yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, Markup.inlineKeyboard(buttons));
    }

    // Use Gemini
    const goalList = userGoals.map(g => `${g.title} (id: ${g.id})`).join(", ");
    try {
        const response = await ai.models.generateContent({
           model: "gemini-3.5-flash",
           systemInstruction: `Siz foydalanuvchiga moliyaviy maqsadlariga erishishda yordam beruvchi do'stona virtual moliya yordamchisisiz. Qisqa va foydali o'zbek tilida gaplashasiz.
Agar foydalanuvchi qandaydir summa miqdorini maqsad uchun jamg'arganini aytgan bo'lsa (masalan, "Noutbukka 50 ming", "10000 oldim"), maxsus 'add_transaction' funksiyasidan foydalanib summani yozib qo'ying ("ming" / "k" = 000). Qaysi maqsad uchun qo'shganligini u aytgan gapdan fahmlang.
Agar foydalanuvchi shunchaki maslahat so'rasa yoki motivatsiya kerak bo'lsa (masalan, "qanday pul tejlasam bo'ladi?", "bugun qiyin kun bo'ldi"), funksiyani chaqirmasdan, samimiy matnli javob yozing.
Mavjud maqsadlari: ${goalList} (agar gapida bulardan birortasi aniq ishora qilingan bo'lsa id sini funksiyaga bering, agar ishora qilinmagan bo'lsa id ni bo'sh qoldiring).`,
           contents: text,
           config: {
             tools: [{
                functionDeclarations: [{
                   name: "add_transaction",
                   description: "Foydalanuvchining tejab qo'ygan pul miqdorini kassaga (tranzaksiyaga) qo'shish.",
                   parameters: {
                      type: Type.OBJECT,
                      properties: {
                         amount: { type: Type.NUMBER, description: "Yig'ib qo'yilgan, ajratilgan yoki tejalgan summa (UZS) rakamlarda. Masalan: 50 ming desa 50000 qilib berasiz, 100k = 100000." },
                         goalId: { type: Type.STRING, description: "Qaysi maqsadga pul qo'shilayotganini ifodalovchi 'id'. Gapga mos maqsad mavjud bo'lsagina id yuboring. Agar aniq bo'lmasa yo'q bo'lsa, stringni bo'sh qoldiring." }
                      },
                      required: ["amount"]
                   }
                }]
             }]
           }
        });

        if (response.functionCalls && response.functionCalls.length > 0) {
           const funcCall = response.functionCalls[0];
           if (funcCall.name === "add_transaction") {
              const amount = funcCall.args.amount as number;
              const goalId = funcCall.args.goalId as string;

              if (goalId) {
                  const targetGoal = userGoals.find(g => g.id === goalId);
                  if (targetGoal) {
                      targetGoal.currentAmount += amount;
                      transactions.push({ id: crypto.randomUUID(), userId, goalId: targetGoal.id, amount, note: text + ' (Gemini AI)', createdAt: new Date().toISOString() });
                      let message = `✅ ${amount.toLocaleString()} UZS "${targetGoal.title}" maqsadiga qo'shildi!\n\nJami yig'ildi: ${targetGoal.currentAmount.toLocaleString()} / ${targetGoal.targetAmount ? targetGoal.targetAmount.toLocaleString() : 'N/A'} UZS`;
                      if (targetGoal.currentAmount >= targetGoal.targetAmount) message += `\n\n🎉 Tabriklaymiz! Siz "${targetGoal.title}" uchun yetarli pul yig'dingiz!`;
                      return ctx.reply(message);
                  }
              }

              // Need to select goal manually
              const buttons = userGoals.map(g => [Markup.button.callback(g.title, `add_${amount}_${g.id}`)]);
              return ctx.reply(`💳 ${amount.toLocaleString()} UZS yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, Markup.inlineKeyboard(buttons));
           }
        }
        
        if (response.text) {
           return ctx.reply(response.text);
        }
    } catch(err) {
        console.error("Gemini err:", err);
        return ctx.reply("Sizni tushunolmadim, lekin raqamlarda ifodalasangiz bo'ladi (M: 50000 noutbuk).");
    }
  });

  bot.action(/^add_(\d+)_([A-Za-z0-9\-]+)$/, async (ctx) => {
    const amount = parseInt(ctx.match[1], 10);
    const goalId = ctx.match[2];
    const userId = ctx.from?.id;

    if (!userId) return;

    const goal = goals.find(g => g.id === goalId && g.userId === userId);
    if (!goal) {
      return ctx.answerCbQuery("❌ Kechirasiz, maqsad topilmadi.");
    }

    // Process transaction
    goal.currentAmount += amount;
    transactions.push({
      id: crypto.randomUUID(),
      userId,
      goalId: goal.id,
      amount,
      note: 'Bot orqali tanlandi',
      createdAt: new Date().toISOString(),
    });

    await ctx.answerCbQuery("✅ Saqlandi!");
    
    let message = `✅ ${amount.toLocaleString()} UZS "${goal.title}" maqsadiga qo'shildi!\n\n` +
      `Jami yig'ildi: ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount ? goal.targetAmount.toLocaleString() : 'N/A'} UZS`;
    
    if (goal.currentAmount >= goal.targetAmount) {
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
    const { title, targetAmount, color } = req.body;

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
      createdAt: new Date().toISOString()
    };

    goals.push(newGoal);
    res.json(newGoal);
  });

  // 3a. Update Goal
  app.put("/api/goals/:id", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const { title, targetAmount, color } = req.body;
    const goalId = req.params.id;

    const goal = goals.find(g => g.id === goalId && g.userId === userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (title) goal.title = title;
    if (targetAmount) goal.targetAmount = parseInt(targetAmount, 10);
    if (color) goal.color = color;

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
    const { displayName } = req.body;
    
    const userProfile = users.find(u => u.userId === userId);
    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    userProfile.displayName = displayName;
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
