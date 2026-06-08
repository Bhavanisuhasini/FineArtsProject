import { getPool, sql } from "../config/db.js";

/* ================= DASHBOARD ================= */
export const getTrainerDashboard = async (req, res) => {
  const pool = getPool();
  const accountId = req.account.id;

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT 
        (SELECT COUNT(*) FROM classes WHERE trainer_id IN 
          (SELECT id FROM trainers WHERE account_id=@account_id)
        ) AS total_classes,

        (SELECT COUNT(*) FROM bookings WHERE trainer_id IN 
          (SELECT id FROM trainers WHERE account_id=@account_id)
        ) AS total_bookings,

        (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE trainer_id IN 
          (SELECT id FROM trainers WHERE account_id=@account_id)
        ) AS total_students
    `);

  res.json({ success: true, data: result.recordset[0] });
};

/* ================= BOOKINGS ================= */
export const getTrainerBookings = async (req, res) => {
  const pool = getPool();
  const accountId = req.account.id;

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT b.*, u.name AS student_name
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      WHERE b.trainer_id IN (
        SELECT id FROM trainers WHERE account_id=@account_id
      )
      ORDER BY b.created_at DESC
    `);

  res.json({ success: true, data: result.recordset });
};

/* ================= STUDENTS ================= */
export const getTrainerStudents = async (req, res) => {
  const pool = getPool();
  const accountId = req.account.id;

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT DISTINCT u.*
      FROM users u
      JOIN bookings b ON b.user_id = u.id
      WHERE b.trainer_id IN (
        SELECT id FROM trainers WHERE account_id=@account_id
      )
    `);

  res.json({ success: true, data: result.recordset });
};

/* ================= CREATE SESSION ================= */
export const createSession = async (req, res) => {
  const pool = getPool();
  const accountId = req.account.id;

  const { booking_id, zoom_link, date_time } = req.body;

  const result = await pool.request()
    .input("booking_id", sql.BigInt, booking_id)
    .input("zoom_link", sql.NVarChar(500), zoom_link)
    .input("date_time", sql.DateTime, date_time)
    .query(`
      INSERT INTO sessions (booking_id, zoom_link, date_time)
      OUTPUT INSERTED.*
      VALUES (@booking_id, @zoom_link, @date_time)
    `);

  // TODO: send email here

  res.json({ success: true, data: result.recordset[0] });
};