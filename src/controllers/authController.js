import { getPool, sql } from "../config/db.js";

export const login = async (req, res) => {
  try {
    const { uid, email, phone } = req.body;

    const pool = getPool();

    // ✅ CHECK IF USER EXISTS
    const existing = await pool.request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM accounts WHERE email = @email");

    if (existing.recordset.length > 0) {
      return res.json({
        success: true,
        user: existing.recordset[0],
      });
    }

    // ✅ INSERT ONLY IF NOT EXISTS
    const result = await pool.request()
      .input("uid", sql.VarChar, uid)
      .input("email", sql.VarChar, email)
      .input("phone", sql.VarChar, phone)
      .query(`
        INSERT INTO accounts (firebase_uid, email, phone, role, is_active)
        OUTPUT INSERTED.*
        VALUES (@uid, @email, @phone, 'USER', 1)
      `);

    res.json({
      success: true,
      user: result.recordset[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

export const me = async (req, res) => {
  res.json({ success: true, user: req.user });
};