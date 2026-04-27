import jwt from "jsonwebtoken";
import { getPool, sql } from "../config/db.js";

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin token missing"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
    return res.status(401).json({
      success: false,
      message: "Invalid admin token"
    });
  }
};