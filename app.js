import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import routes from "./src/routes/index.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();

// body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static (FIX images)
app.use("/uploads", express.static(path.resolve("uploads")));

// cors
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// ✅ FIX: COOP header — allows Firebase Google popup to work
// "same-origin" was blocking window.closed polling by Firebase
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // ✅ FIXED
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// helmet - keep CSP off for now
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

app.use(morgan("dev"));

// routes
app.use("/api", routes);

// test
app.get("/", (req, res) => {
  res.json({ message: "API Running 🚀" });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// error handler
app.use(errorHandler);

export default app;