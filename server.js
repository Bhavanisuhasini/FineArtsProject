// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import swaggerUi from "swagger-ui-express";

// import { connectDB } from "./src/config/db.js";
// import routes from "./src/routes/index.js";
// import { swaggerDocument } from "./src/docs/swagger.js";
// import { errorHandler } from "./src/middlewares/errorHandler.js";

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(cors({
//   origin: true,
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Accept"]
// }));

// app.options("/*splat", cors({
//   origin: true,
//   credentials: true
// }));

// app.use(helmet({ contentSecurityPolicy: false }));
// app.use(morgan("dev"));

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.get("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "FineArts API running"
//   });
// });

// app.use("/api", routes);

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.method} ${req.originalUrl}`
//   });
// });

// app.use(errorHandler);

// connectDB()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log("JWT_SECRET loaded:", process.env.JWT_SECRET ? "YES" : "NO");
//     });
//   })
//   .catch((error) => {
//     console.error("❌ DB connection failed:", error);
//     process.exit(1);
//   });


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { connectDB } from "./src/config/db.js";
import routes from "./src/routes/index.js";
import { swaggerDocument } from "./src/docs/swagger.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import path from "path";


const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.options("/*splat", cors({
  origin: true,
  credentials: true
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FineArts API running"
  });
});

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("JWT_SECRET loaded:", process.env.JWT_SECRET ? "YES" : "NO");
    });
  })
  .catch((error) => {
    console.error("❌ DB connection failed:", error);
    process.exit(1);
  });