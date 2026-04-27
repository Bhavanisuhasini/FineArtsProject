import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

export const connectDB = async () => {
  try {
    pool = await sql.connect(dbConfig);
<<<<<<< HEAD
    console.log("✅ MSSQL connected successfully");
    return pool;
  } catch (error) {
    console.error("❌ MSSQL connection failed:", error.message);
=======
    console.log(" MSSQL connected successfully");
    return pool;
  } catch (error) {
    console.error(" MSSQL connection failed:", error.message);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
    throw error;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error("Database pool not initialized. Call connectDB() first.");
  }
  return pool;
};

export { sql };