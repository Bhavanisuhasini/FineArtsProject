import { getPool, sql } from "../config/db.js";

/* ── USER DASHBOARD ─────────────────────────────────────────────────────── */
export const getUserDashboard = async (accountId) => {
  const pool = getPool();

  const stats = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM bookings WHERE user_id = @user_id) AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE user_id = @user_id AND status = 'CONFIRMED'
          AND start_date >= CAST(GETDATE() AS DATE)) AS upcoming_classes,
        (SELECT COUNT(*) FROM bookings WHERE user_id = @user_id AND status = 'COMPLETED') AS completed_classes,
        (SELECT ISNULL(SUM(amount), 0) FROM payments WHERE user_id = @user_id AND status = 'SUCCESS') AS total_payments
    `);

  const upcoming = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT TOP 5
        b.id AS booking_id, b.status, b.start_date, b.amount,
        c.title AS class_title, c.mode, c.level,
        t.full_name AS trainer_name,
        i.name AS institute_name
      FROM bookings b
      LEFT JOIN classes c ON b.class_id = c.id
      LEFT JOIN trainers t ON b.trainer_id = t.id
      LEFT JOIN institutes i ON b.institute_id = i.id
      WHERE b.user_id = @user_id AND b.status = 'CONFIRMED'
        AND b.start_date >= CAST(GETDATE() AS DATE)
      ORDER BY b.start_date ASC
    `);

  return {
    stats: stats.recordset[0],
    upcoming_classes: upcoming.recordset,
  };
};

/* ── TRAINER DASHBOARD ──────────────────────────────────────────────────── */
export const getTrainerDashboard = async (accountId) => {
  const pool = getPool();

  const trainerRow = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, full_name, approval_status, is_profile_completed FROM trainers WHERE account_id = @account_id`);

  if (trainerRow.recordset.length === 0) throw new Error("Trainer not found");
  const trainer = trainerRow.recordset[0];

  const stats = await pool.request()
    .input("trainer_id", sql.BigInt, trainer.id)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM classes WHERE trainer_id = @trainer_id AND is_active = 1) AS total_classes,
        (SELECT COUNT(DISTINCT user_id) FROM bookings WHERE trainer_id = @trainer_id AND status IN ('CONFIRMED','COMPLETED')) AS total_students,
        (SELECT COUNT(*) FROM bookings WHERE trainer_id = @trainer_id AND status = 'CONFIRMED'
          AND start_date >= CAST(GETDATE() AS DATE)) AS upcoming_classes,
        (SELECT ISNULL(SUM(amount), 0) FROM bookings WHERE trainer_id = @trainer_id AND status = 'COMPLETED') AS total_earnings
    `);

  const upcoming = await pool.request()
    .input("trainer_id", sql.BigInt, trainer.id)
    .query(`
      SELECT TOP 5
        b.id AS booking_id, b.start_date, b.status,
        c.title AS class_title, c.mode,
        a.phone_number AS student_phone
      FROM bookings b
      LEFT JOIN classes c ON b.class_id = c.id
      LEFT JOIN accounts a ON b.user_id = a.id
      WHERE b.trainer_id = @trainer_id AND b.status = 'CONFIRMED'
        AND b.start_date >= CAST(GETDATE() AS DATE)
      ORDER BY b.start_date ASC
    `);

  return {
    trainer: { full_name: trainer.full_name, approval_status: trainer.approval_status, is_profile_completed: trainer.is_profile_completed },
    stats: stats.recordset[0],
    upcoming_classes: upcoming.recordset,
  };
};

/* ── INSTITUTE DASHBOARD ────────────────────────────────────────────────── */
export const getInstituteDashboard = async (accountId) => {
  const pool = getPool();

  const instRow = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, name, approval_status FROM institutes WHERE account_id = @account_id`);

  if (instRow.recordset.length === 0) throw new Error("Institute not found");
  const institute = instRow.recordset[0];

  const stats = await pool.request()
    .input("institute_id", sql.BigInt, institute.id)
    .query(`
      SELECT
        (SELECT COUNT(*) FROM trainers WHERE institute_id = @institute_id AND is_active = 1) AS total_trainers,
        (SELECT COUNT(*) FROM classes WHERE institute_id = @institute_id AND is_active = 1) AS total_classes,
        (SELECT COUNT(*) FROM bookings WHERE institute_id = @institute_id) AS total_bookings,
        (SELECT ISNULL(SUM(amount), 0) FROM bookings WHERE institute_id = @institute_id AND status = 'COMPLETED') AS total_revenue
    `);

  const recentBookings = await pool.request()
    .input("institute_id", sql.BigInt, institute.id)
    .query(`
      SELECT TOP 5
        b.id, b.status, b.amount, b.start_date,
        c.title AS class_title,
        a.phone_number AS student_phone
      FROM bookings b
      LEFT JOIN classes c ON b.class_id = c.id
      LEFT JOIN accounts a ON b.user_id = a.id
      WHERE b.institute_id = @institute_id
      ORDER BY b.created_at DESC
    `);

  return {
    institute: { name: institute.name, approval_status: institute.approval_status },
    stats: stats.recordset[0],
    recent_bookings: recentBookings.recordset,
  };
};

/* ── ADMIN DASHBOARD ────────────────────────────────────────────────────── */
export const getAdminDashboard = async () => {
  const pool = getPool();

  const stats = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM accounts WHERE role = 'USER') AS total_users,
      (SELECT COUNT(*) FROM trainers) AS total_trainers,
      (SELECT COUNT(*) FROM institutes) AS total_institutes,
      (SELECT COUNT(*) FROM classes WHERE is_active = 1) AS total_classes,
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT ISNULL(SUM(amount), 0) FROM payments WHERE status = 'SUCCESS') AS total_revenue,
      (SELECT COUNT(*) FROM trainers WHERE approval_status = 'PENDING') AS pending_trainers,
      (SELECT COUNT(*) FROM institutes WHERE approval_status = 'PENDING') AS pending_institutes
  `);

  return stats.recordset[0];
};

export const getAdminRevenue = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      CAST(created_at AS DATE) AS date,
      COUNT(*) AS transactions,
      SUM(amount) AS revenue
    FROM payments
    WHERE status = 'SUCCESS'
    GROUP BY CAST(created_at AS DATE)
    ORDER BY date DESC
  `);
  return result.recordset;
};

export const getAdminBookingsSummary = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT status, COUNT(*) AS count, ISNULL(SUM(amount), 0) AS amount
    FROM bookings
    GROUP BY status
  `);
  return result.recordset;
};

export const getAdminUsersSummary = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT role, COUNT(*) AS count
    FROM accounts
    GROUP BY role
  `);
  return result.recordset;
};