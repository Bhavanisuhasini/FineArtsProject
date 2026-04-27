import { sql, getPool } from "../config/db.js";

export const accountAuth = async (req, res, next) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({
        message: "Firebase auth must run before account auth"
      });
    }

    const { uid } = req.firebaseUser;
    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar, uid)
      .query("SELECT * FROM accounts WHERE firebase_uid = @firebase_uid");

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Account not found. Please login first."
      });
    }

    req.account = result.recordset[0];
    next();

  } catch (error) {
    console.error("Account auth error:", error);
    res.status(500).json({ message: "Account authentication failed" });
  }
};