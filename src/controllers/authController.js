import { sql, getPool } from "../config/db.js";

export const login = async (req, res) => {
  try {
    const { uid, email, phone_number } = req.firebaseUser;

    const role = req.body.role?.toUpperCase() || "USER";

    if (!["USER", "TRAINER", "INSTITUTE", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Use USER, TRAINER, INSTITUTE, or ADMIN"
      });
    }

    const pool = getPool();

    const existing = await pool.request()
      .input("firebase_uid", sql.NVarChar, uid)
      .query(`
        SELECT * FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    let account;

    if (existing.recordset.length === 0) {
      if (role === "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin account cannot be created from login API"
        });
      }

      const result = await pool.request()
        .input("firebase_uid", sql.NVarChar, uid)
        .input("email", sql.NVarChar, email || null)
        .input("phone_number", sql.NVarChar, phone_number || null)
        .input("role", sql.NVarChar, role)
        .query(`
          INSERT INTO accounts
          (firebase_uid, email, phone_number, role, is_verified)
          OUTPUT INSERTED.*
          VALUES
          (@firebase_uid, @email, @phone_number, @role, 1)
        `);

      account = result.recordset[0];
    } else {
      account = existing.recordset[0];

      if (account.role !== role) {
        const updated = await pool.request()
          .input("id", sql.BigInt, account.id)
          .input("role", sql.NVarChar, role)
          .query(`
            UPDATE accounts
            SET role = @role,
                updated_at = SYSDATETIME()
            OUTPUT INSERTED.*
            WHERE id = @id
          `);

        account = updated.recordset[0];
      }
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: account
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: req.account
  });
};