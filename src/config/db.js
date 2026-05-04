import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port:     parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt:              process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true",
    connectTimeout:       30000,
    requestTimeout:       30000,
  },
  pool: {
    max:                10,
    min:                2,
    idleTimeoutMillis:  30000,
    acquireTimeoutMillis: 30000,
  },
};

let pool = null;

export const connectDB = async () => {
  try {
    pool = await sql.connect(dbConfig);

    pool.on("error", (err) => {
      console.error("DB pool error:", err.message);
    });

    console.log("✅ MSSQL connected successfully");
    return pool;
  } catch (error) {
    console.error("❌ MSSQL connection failed:", error.message);
    throw error;
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error("Database not connected. Ensure connectDB() was called at startup.");
  }
  return pool;
};

export { sql };
