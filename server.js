import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded ✅" : "Missing ❌");
    });
  })
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });