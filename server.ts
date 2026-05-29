import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Telegraf, Markup } from "telegraf";
import { createServer as createViteServer } from "vite";
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

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    
    // Raqamni ajratib olish (summ)
    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
      return ctx.reply("Iltimos, kiritmoqchi bo'lgan summangizni yozing (masalan: 50000 noutbuk).");
    }

    const amount = parseInt(amountMatch[0], 10);
    const note = text.replace(amountMatch[0], '').trim().toLowerCase();

    const userGoals = goals.filter(g => g.userId === userId);

    if (userGoals.length === 0) {
      return ctx.reply("Sizda hali maqsadlar yo'q! 🎯\nIltimos, avval Mini App orqali yangi maqsad (kategoriya) qo'shing.");
    }

    // Try fuzzy match
    let matchedGoal = null;
    if (note.length > 2) {
      const cleanNote = note.replace('uchun', '').replace('ga', '').trim();
      matchedGoal = userGoals.find(g => 
        cleanNote.includes(g.title.toLowerCase()) || 
        g.title.toLowerCase().includes(cleanNote)
      );
    }

    if (matchedGoal) {
      // Auto add exactly to matched goal
      matchedGoal.currentAmount += amount;
      transactions.push({
        id: crypto.randomUUID(),
        userId,
        goalId: matchedGoal.id,
        amount,
        note: text,
        createdAt: new Date().toISOString(),
      });
      return ctx.reply(
        `✅ ${amount.toLocaleString()} UZS "${matchedGoal.title}" maqsadiga qo'shildi!\n\n` +
        `Jami yig'ildi: ${matchedGoal.currentAmount.toLocaleString()} / ${matchedGoal.targetAmount ? matchedGoal.targetAmount.toLocaleString() : 'N/A'} UZS`
      );
    }

    // If no direct match, show inline keyboard for selection
    const buttons = userGoals.map(g => {
      // Create callback payload: max 64 bytes
      // "add_金额_id" e.g., "add_50000_12345678-..."
      const payload = `add_${amount}_${g.id}`;
      return [Markup.button.callback(g.title, payload)];
    });

    return ctx.reply(
      `💳 ${amount.toLocaleString()} UZS yozildi.\nQaysi maqsad (kategoriya) uchun qo'shamiz?`, 
      Markup.inlineKeyboard(buttons)
    );
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
    await ctx.editMessageText(
      `✅ ${amount.toLocaleString()} UZS "${goal.title}" maqsadiga qo'shildi!\n\n` +
      `Jami yig'ildi: ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount ? goal.targetAmount.toLocaleString() : 'N/A'} UZS`
    );
  });

  bot.launch().catch(console.error);

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
    const userGoals = goals.filter(g => g.userId === userId);
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
