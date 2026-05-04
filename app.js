import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import swaggerUi from "swagger-ui-express";
import routes from "./src/routes/index.js";

const app = express();

/* ── Security headers ───────────────────────────────────────────────────── */
app.use(helmet());

/* ── CORS ───────────────────────────────────────────────────────────────── */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

/* ── Request logging ────────────────────────────────────────────────────── */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ── Body parsing ───────────────────────────────────────────────────────── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Rate limiting ──────────────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

app.use("/api", limiter);
app.use("/api/auth", authLimiter);
app.use("/api/admin-auth", authLimiter);

/* ── API routes ─────────────────────────────────────────────────────────── */
app.use("/api", routes);

/* ── Swagger docs ───────────────────────────────────────────────────────── */
try {
  const swaggerDocument = load(readFileSync("./finearts-academy-swagger.yaml", "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "FineArts Academy API",
  }));
} catch (_) {
  console.warn("Swagger YAML not found — /api-docs disabled");
}

/* ── Health check ───────────────────────────────────────────────────────── */
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ── 404 handler ────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

/* ── Global error handler ───────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong on our end. Please try again." : err.message,
  });
});

export default app;
