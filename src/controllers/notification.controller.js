import { getPool, sql } from "../config/db.js";

// ✅ GET my notifications
export const getMyNotificationsHandler = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const pool = getPool();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT * FROM notifications
        WHERE user_id = @user_id
        ORDER BY created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ MARK single notification as read
export const markAsReadHandler = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input("id",      sql.BigInt, req.params.id)
      .input("user_id", sql.BigInt, req.user?.id)
      .query(`
        UPDATE notifications SET is_read = 1
        WHERE id = @id AND user_id = @user_id
      `);

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ MARK ALL as read
export const markAllAsReadHandler = async (req, res) => {
  try {
    const pool = getPool();
    await pool.request()
      .input("user_id", sql.BigInt, req.user?.id)
      .query(`UPDATE notifications SET is_read = 1 WHERE user_id = @user_id`);

    res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ SEND notification (admin use)
export const sendNotificationHandler = async (req, res) => {
  try {
    const { user_id, title, message, type, body } = req.body;
    const pool = getPool();

    await pool.request()
      .input("user_id", sql.BigInt,   user_id)
      .input("title",   sql.NVarChar, title)
      .input("message", sql.NVarChar, message)
      .input("type",    sql.NVarChar, type || "GENERAL")
      .input("body",    sql.NVarChar, body || null)
      .input("is_read", sql.Bit,      0)
      .query(`
        INSERT INTO notifications (user_id, title, message, type, body, is_read, created_at)
        VALUES (@user_id, @title, @message, @type, @body, @is_read, SYSDATETIME())
      `);

    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};