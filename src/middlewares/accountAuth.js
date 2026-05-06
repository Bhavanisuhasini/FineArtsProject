import { getPool, sql } from "../config/db.js";

export const accountAuth = async (req, res, next) => {
  try {
    const { uid } = req.firebaseUser;

    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar, uid)
      .query(`
        SELECT *
        FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Account not found. Please login first."
      });
    }

    req.account = result.recordset[0];

    next();
  } catch (error) {
    console.error("Account Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Account authentication failed",
      error: error.message
    });
  }
};