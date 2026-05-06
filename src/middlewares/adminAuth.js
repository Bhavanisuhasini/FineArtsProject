import jwt from "jsonwebtoken";
import { getPool, sql } from "../config/db.js";

const ADMIN_SECRET = "finearts_admin_secret_2026";

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

    const decoded = jwt.verify(token, ADMIN_SECRET);

    const pool = getPool();

    const result = await pool.request()
      .input("id", sql.BigInt, decoded.account_id)
      .query(`
        SELECT *
        FROM accounts
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
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};