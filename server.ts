import express from "express";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Telegraf } from "telegraf";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

// In-memory simple database
type Donation = {
  id: string;
  userId: number;
  amount: number;
  description: string;
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

const donations: Donation[] = [];
const users: UserProfile[] = [];

// Initialize Telegraf bot
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "default_unsafe_secret";

let bot: Telegraf | null = null;

if (BOT_TOKEN) {
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply("Welcome to Donation Track Bot! Send me a message like '50000 noutbuk uchun' to register a donation, or open the Mini App to see your stats.");
  });

  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    // Parse format: "50000 noutbuk uchun"
    const match = text.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      return ctx.reply("Please use the format: <Amount> <Description> (e.g. '50000 noutbuk uchun')");
    }

    const amount = parseInt(match[1], 10);
    const description = match[2];
    const userId = ctx.from.id;

    donations.push({
      id: crypto.randomUUID(),
      userId,
      amount,
      description,
      createdAt: new Date().toISOString(),
    });

    ctx.reply(`✅ Successfully saved donation of ${amount} for "${description}".`);
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
      // Create data check string
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
      
      // Update or create user profile
      let userProfile = users.find(u => u.userId === user.id);
      if (!userProfile) {
        userProfile = {
          userId: user.id,
          telegramUsername: user.username,
          telegramFirstName: user.first_name,
          telegramLastName: user.last_name,
          telegramPhotoUrl: user.photo_url,
          displayName: user.first_name || user.username || "User",
        };
        users.push(userProfile);
      } else {
        // Update details in case they changed on Telegram's side
        userProfile.telegramUsername = user.username;
        userProfile.telegramFirstName = user.first_name;
        userProfile.telegramLastName = user.last_name;
        userProfile.telegramPhotoUrl = user.photo_url;
      }

      // Issue a JWT session token for the user
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      
      res.json({ token, userId: user.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error during auth" });
    }
  });

  // Verify JWT Middleware
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

  // 2. Fetch donations (Protected)
  app.get("/api/donations", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const userDonations = donations.filter(d => d.userId === userId);
    
    // Reverse sort by time (latest first)
    userDonations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ donations: userDonations });
  });

  // 3. Get user profile
  app.get("/api/user/profile", authMiddleware, (req, res) => {
    const userId = (req as any).user.userId;
    const userProfile = users.find(u => u.userId === userId);
    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ profile: userProfile });
  });

  // 4. Update display name
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

  // Vite middleware for development
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
