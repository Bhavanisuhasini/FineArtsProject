import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import { connectDB } from "./src/config/db.js";
import routes from "./src/routes/index.js";
import { swaggerDocument } from "./src/docs/swagger.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* Middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  })
);

app.options(
  "/*splat",
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(morgan("dev"));

/* Swagger */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* Health */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FineArts API running"
  });
});

/* All Routes */
app.use("/api", routes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

/* Error Handler */
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`
      );
    });
  })
  .catch((error) => {
    console.error("❌ DB connection failed:", error);
    process.exit(1);
  });