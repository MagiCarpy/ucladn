import express from "express";
import path from "path";
import { sequelize, createDatabaseIfNotExists } from "./config/db.js";
import { connectRedis } from "./config/redisDb.js";
import {
  ROOT_PATH,
  ROOT_ENV_PATH,
  PUBLIC_PATH,
  UPLOADS_PATH,
} from "./config/paths.js";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import RateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { validateEnv } from "./config/envValidator.js";
import userRoutes from "./routes/user.js";
import healthRoutes from "./routes/health.js";
import requestRoutes from "./routes/request.js";
import directionsRoutes from "./routes/directions.js";
import "./models/request.model.js";
import "./models/associations.js";
import "./models/message.model.js";
import "./models/associations.js";

dotenv.config({ path: ROOT_ENV_PATH });
validateEnv();

const PORT = parseInt(process.env.PORT) || 5000;

export const app = express();
const server = createServer(app); // http server (for socket.io)

// Socket.io INIT
const io = new Server(server, {
  cors: {
    origin: true, // FIXME: true => ALLOW ALL ORIGIN (CHANGE IN PROD)
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client Connected:", socket.id);

  // chatId is "requestId" FIXME: make random??
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log("Client joined:", chatId);
  });

  socket.on("disconnect", () => {
    console.log("Client Disconnected:", socket.id);
  });
});

// APP MIDDLEWARE
// rate limit to 100 requests every 30 seconds
const limiter = RateLimit({
  windowMs: 1 * 30 * 1000,
  max: 100,
});
if (process.env.NODE_ENV === "production") app.use(limiter);
app.use(compression());
app.use(
  // allows access to root and public folder contents
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.openstreetmap.org", "https://unpkg.com"],
    },
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// socket middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// serve static files
app.use("/public", express.static(PUBLIC_PATH));

// Fallback for missing public images (like profile pictures)
app.use("/public", (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  if (imageExtensions.includes(ext)) {
    return res.sendFile(path.join(PUBLIC_PATH, "default.jpg"));
  }
  next();
});

import messageRoutes from "./routes/message.js";
import "./models/message.model.js";

import fs from "fs/promises";

// Ensure uploads folder exists
await fs.mkdir(UPLOADS_PATH, { recursive: true }).catch(() => {});

app.use("/api/user", userRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/directions", directionsRoutes);
app.use("/api/messages", messageRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  // Handle Multer upload limits/errors cleanly
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ error: "File size limit exceeded (max 5MB)" });
  }

  res.status(500).json({ error: "Internal server error" });
});

// Serve Static Assets in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(ROOT_PATH, "frontend", "dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(ROOT_PATH, "frontend", "dist", "index.html")),
  );
} else {
  app.get("/", (req, res) => {
    res.status(200).send("Server is running...");
  });
}

// Server Start
if (import.meta.url === `file://${process.argv[1]}`) {
  // server listen with socket.io
  server.listen(PORT, async () => {
    console.log(`Server started on PORT: ${PORT}`);

    //Test database connection and create table if not already created
    await createDatabaseIfNotExists();
    connectAndSync();
  });
}

// Helper functions
// FIXME: configure to dockerize both MySQL and Redis
async function connectAndSync() {
  try {
    console.log("\n");
    // mysql setup and connection
    console.log("========MYSQL_SETUP========");
    await sequelize.authenticate();
    console.log("MySQL Connection Successful.");

    await sequelize.sync({ alter: true }); // Creates tables if they don't exist + changes them
    // await sequelize.sync({ force: true }); // WARNING: Will drop existing tables and recreate them

    console.log("Models created and synchronized.");
    console.log("===========================");

    console.log("\n");
    // redis connection
    console.log("========REDIS_SETUP========");
    await connectRedis();
    console.log("===========================");
  } catch (error) {
    console.error("Error connecting to databases or syncing tables.", error);
  }
  console.log("\n");
}
