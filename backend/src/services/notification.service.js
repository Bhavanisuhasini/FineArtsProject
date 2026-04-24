import { getPool, sql } from "../config/db.js";

/**
 * 1. GET MY NOTIFICATIONS
 */
export const getMyNotifications = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`
      SELECT * FROM notifications
      WHERE user_id=@user_id
      ORDER BY created_at DESC
    `);

  return result.recordset;
};

/**
 * 2. MARK AS READ
 */
export const markAsRead = async (id, userId) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("user_id", sql.Int, userId)
    .query(`
      UPDATE notifications
      SET is_read=1
      WHERE id=@id AND user_id=@user_id
    `);

  return { id, is_read: true };
};

/**
 * 3. MARK ALL AS READ
 */
export const markAllRead = async (userId) => {
  const pool = getPool();

  await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`
      UPDATE notifications
      SET is_read=1
      WHERE user_id=@user_id
    `);

  return { message: "All notifications marked as read" };
};

/**
 * 4. SEND NOTIFICATION
 */
export const sendNotification = async (body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, body.user_id)
    .input("title", sql.NVarChar, body.title)
    .input("message", sql.NVarChar, body.message)
    .input("type", sql.NVarChar, body.type || "IN_APP")
    .query(`
      INSERT INTO notifications (user_id, title, message, type)
      OUTPUT INSERTED.*
      VALUES (@user_id, @title, @message, @type)
    `);

  // 👉 Optional: trigger email/SMS here
  // if (body.type === 'EMAIL') call email service
  // if (body.type === 'SMS') call SMS gateway

  return result.recordset[0];
};