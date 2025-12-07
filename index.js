import { configDotenv } from "dotenv";
configDotenv();
const PORT = process.env.PORT || 4000;
const uri = process.env.MONGODB_URI;
import express, { json } from "express";
const app = express();
import "dotenv/config";

import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import graphRouter from "./routers/graphRouter.js";
import uploadRouter from "./routers/uploadRouter.js";
import adminRouter from "./routers/adminRouter.js";
app.use(json());
app.use(helmet());
app.use(
  cors({
    origin: "https://makeamitsva-orgf.onrender.com",
    credentials: true,
  })
);

import userRouter from "./routers/userRouter.js";
import requestRouter from "./routers/requestRouter.js";
import chatRouter from "./routers/chatRouter.js";
app.use("/api/upload", uploadRouter);
app.use("/api/users", userRouter);
app.use("/api/requests", requestRouter);
app.use("/api/chats", chatRouter);
app.use("/api/admin", adminRouter);
app.use("/api/graphs", graphRouter);
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    database: {
      state: states[dbState],
      name: mongoose.connection.name || "N/A",
      host: mongoose.connection.host || "N/A",
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

if (!uri) {
  console.error("No uri found in env file (MONGODB_URI is missing)");
  process.exit(1);
}
mongoose
  .connect(uri)
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

if (uri) {
  app.listen(PORT, () => {
    console.log("Server is running on port: ", PORT);
  });
} else {
  console.error("No uri found in env file (MONGODB_URI is missing)");
  process.exit(1);
}
