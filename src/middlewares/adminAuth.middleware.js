import jwt from "jsonwebtoken";
import { getPool, sql } from "../config/db.js";

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT VERIFY ERROR:", err.message);

      return res.status(401).json({
        success: false,
        message:
          err.name === "TokenExpiredError"
            ? "Admin token expired"
            : "Invalid admin token"
      });
    }

    const pool = getPool();

    const result = await pool.request()
      .input("id", sql.BigInt, decoded.account_id)
      .query(`
        SELECT * FROM accounts
        WHERE id = @id
          AND role = 'ADMIN'
          AND is_active = 1
      `);

    const admin = result.recordset[0];

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied"
      });
    }

    req.admin = admin;
    next();

  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Admin authentication failed",
      error: error.message
    });
  }
};