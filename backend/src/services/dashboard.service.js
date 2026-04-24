import { getPool, sql } from "../config/db.js";

/* =========================
   USER DASHBOARD
========================= */
export const userDashboard = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM bookings WHERE user_id=@user_id) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE user_id=@user_id AND status='CONFIRMED') AS confirmed,
        (SELECT COUNT(*) FROM bookings WHERE user_id=@user_id AND status='COMPLETED') AS completed,
        (SELECT COUNT(*) FROM payments WHERE user_id=@user_id AND status='PAID') AS payments_done
    `);

  return result.recordset[0];
};

/* =========================
   TRAINER DASHBOARD
========================= */
export const trainerDashboard = async (trainerId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("trainer_id", sql.Int, trainerId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM classes WHERE trainer_id=@trainer_id) AS total_classes,
        (SELECT COUNT(*) FROM bookings WHERE trainer_id=@trainer_id) AS total_students,
        (SELECT SUM(amount) FROM bookings WHERE trainer_id=@trainer_id AND status='CONFIRMED') AS revenue
    `);

  return result.recordset[0];
};

/* =========================
   INSTITUTE DASHBOARD
========================= */
export const instituteDashboard = async (instituteId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("institute_id", sql.Int, instituteId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM trainers WHERE institute_id=@institute_id) AS total_trainers,
        (SELECT COUNT(*) FROM classes WHERE institute_id=@institute_id) AS total_classes,
        (SELECT COUNT(*) FROM bookings WHERE institute_id=@institute_id) AS total_bookings,
        (SELECT SUM(amount) FROM bookings WHERE institute_id=@institute_id AND status='CONFIRMED') AS revenue
    `);

  return result.recordset[0];
};

/* =========================
   ADMIN DASHBOARD
========================= */
export const adminDashboard = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM accounts) AS total_users,
      (SELECT COUNT(*) FROM trainers) AS total_trainers,
      (SELECT COUNT(*) FROM institutes) AS total_institutes,
      (SELECT COUNT(*) FROM classes) AS total_classes,
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT SUM(amount) FROM payments WHERE status='PAID') AS total_revenue
  `);

  return result.recordset[0];
};

/* =========================
   REPORTS
========================= */

// Revenue report
export const revenueReport = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT 
      CAST(created_at AS DATE) as date,
      SUM(amount) as revenue
    FROM payments
    WHERE status='PAID'
    GROUP BY CAST(created_at AS DATE)
    ORDER BY date DESC
  `);

  return result.recordset;
};

// Bookings summary
export const bookingSummary = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT status, COUNT(*) as count
    FROM bookings
    GROUP BY status
  `);

  return result.recordset;
};

// Users summary
export const userSummary = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT role, COUNT(*) as count
    FROM accounts
    GROUP BY role
  `);

  return result.recordset;
};