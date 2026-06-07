import { getPool, sql } from "../config/db.js";

export const accountAuth = async (req, res, next) => {
  try {
    // ✅ FIX: firebaseAuth sets req.user, not req.firebaseUser
    if (!req.user) {
      return res.status(401).json({ message: "Firebase user missing" });
    }

    const firebaseUser = req.user; // ✅ FIXED: was req.firebaseUser

    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), firebaseUser.firebase_uid) // ✅ req.user has firebase_uid
      .query(`
        SELECT *
        FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    if (result.recordset.length === 0) {
      const role = req.body.role?.toUpperCase() || "USER";

      const inserted = await pool.request()
        .input("firebase_uid", sql.NVarChar(255), firebaseUser.firebase_uid)
        .input("email", sql.NVarChar(255), firebaseUser.email || null)
        .input("phone_number", sql.NVarChar(20), firebaseUser.phone_number || null)
        .input("role", sql.NVarChar(50), role)
        .query(`
          INSERT INTO accounts (
            firebase_uid,
            email,
            phone_number,
            role,
            is_active,
            is_verified,
            created_at,
            updated_at
          )
          OUTPUT INSERTED.*
          VALUES (
            @firebase_uid,
            @email,
            @phone_number,
            @role,
            1,
            1,
            SYSDATETIME(),
            SYSDATETIME()
          )
        `);

      req.account = inserted.recordset[0];
    } else {
      req.account = result.recordset[0];
    }

    next();
  } catch (error) {
    console.error("Account Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Account authentication failed",
      error: error.message,
    });
  }
};

export default accountAuth;