import { getPool, sql } from "../config/db.js";

/* ── CREATE BOOKING ─────────────────────────────────────────────────────── */
export const createBooking = async (accountId, body) => {
  const pool = getPool();
  const { booking_type, class_id, trainer_id, institute_id, amount, start_date, end_date } = body;

  if (!booking_type) throw new Error("booking_type is required");
  if (!amount)       throw new Error("amount is required");

  const result = await pool.request()
    .input("user_id",      sql.BigInt,       accountId)
    .input("booking_type", sql.NVarChar(20), booking_type)
    .input("class_id",     sql.BigInt,       class_id     ? parseInt(class_id)     : null)
    .input("trainer_id",   sql.BigInt,       trainer_id   ? parseInt(trainer_id)   : null)
    .input("institute_id", sql.BigInt,       institute_id ? parseInt(institute_id) : null)
    .input("amount",       sql.Decimal(10,2),parseFloat(amount))
    .input("start_date",   sql.Date,         start_date ? new Date(start_date) : null)
    .input("end_date",     sql.Date,         end_date   ? new Date(end_date)   : null)
    .query(`
      INSERT INTO bookings
        (user_id, booking_type, class_id, trainer_id, institute_id,
         status, amount, payment_status, start_date, end_date)
      OUTPUT INSERTED.*
      VALUES
        (@user_id, @booking_type, @class_id, @trainer_id, @institute_id,
         'PENDING', @amount, 'PENDING', @start_date, @end_date)
    `);

  return result.recordset[0];
};

/* ── GET MY BOOKINGS ────────────────────────────────────────────────────── */
export const getMyBookings = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT
        b.id, b.booking_type, b.status, b.payment_status,
        b.amount, b.start_date, b.end_date, b.created_at,
        c.title AS class_title, c.mode, c.level, c.duration,
        t.full_name AS trainer_name, t.profile_image AS trainer_image,
        i.name AS institute_name, i.logo AS institute_logo
      FROM bookings b
      LEFT JOIN classes    c ON b.class_id    = c.id
      LEFT JOIN trainers   t ON b.trainer_id  = t.id
      LEFT JOIN institutes i ON b.institute_id= i.id
      WHERE b.user_id = @user_id
      ORDER BY b.created_at DESC
    `);

  return result.recordset;
};

/* ── GET BOOKING BY ID ──────────────────────────────────────────────────── */
export const getBookingById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(id))
    .query(`
      SELECT
        b.*,
        c.title AS class_title, c.mode, c.level,
        t.full_name AS trainer_name,
        i.name AS institute_name
      FROM bookings b
      LEFT JOIN classes    c ON b.class_id    = c.id
      LEFT JOIN trainers   t ON b.trainer_id  = t.id
      LEFT JOIN institutes i ON b.institute_id= i.id
      WHERE b.id = @id
    `);

  if (result.recordset.length === 0) throw new Error("Booking not found");
  return result.recordset[0];
};

/* ── UPDATE STATUS ──────────────────────────────────────────────────────── */
export const updateStatus = async (id, status) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id",     sql.BigInt,       parseInt(id))
    .input("status", sql.NVarChar(20), status)
    .query(`
      UPDATE bookings SET status = @status, updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) throw new Error("Booking not found");
  return result.recordset[0];
};

/* ── GET BY CLASS ───────────────────────────────────────────────────────── */
export const getByClass = async (classId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("class_id", sql.BigInt, parseInt(classId))
    .query(`
      SELECT b.*, a.phone_number AS user_phone
      FROM bookings b
      JOIN accounts a ON b.user_id = a.id
      WHERE b.class_id = @class_id
      ORDER BY b.created_at DESC
    `);
  return result.recordset;
};

/* ── GET BY TRAINER ─────────────────────────────────────────────────────── */
export const getByTrainer = async (trainerId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("trainer_id", sql.BigInt, parseInt(trainerId))
    .query(`
      SELECT b.*, a.phone_number AS user_phone, c.title AS class_title
      FROM bookings b
      JOIN accounts a ON b.user_id = a.id
      LEFT JOIN classes c ON b.class_id = c.id
      WHERE b.trainer_id = @trainer_id
      ORDER BY b.created_at DESC
    `);
  return result.recordset;
};

/* ── GET BY INSTITUTE ───────────────────────────────────────────────────── */
export const getByInstitute = async (instituteId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("institute_id", sql.BigInt, parseInt(instituteId))
    .query(`
      SELECT b.*, a.phone_number AS user_phone, c.title AS class_title
      FROM bookings b
      JOIN accounts a ON b.user_id = a.id
      LEFT JOIN classes c ON b.class_id = c.id
      WHERE b.institute_id = @institute_id
      ORDER BY b.created_at DESC
    `);
  return result.recordset;
};

/* ── CHECK ELIGIBILITY ──────────────────────────────────────────────────── */
export const checkEligibility = async (accountId, body) => {
  const pool = getPool();
  const { class_id, trainer_id, institute_id } = body;

  const request = pool.request().input("user_id", sql.BigInt, accountId);
  let where = `WHERE user_id = @user_id AND status IN ('PENDING','CONFIRMED')`;

  if (class_id)     { where += ` AND class_id = @class_id`;         request.input("class_id",     sql.BigInt, parseInt(class_id)); }
  if (trainer_id)   { where += ` AND trainer_id = @trainer_id`;     request.input("trainer_id",   sql.BigInt, parseInt(trainer_id)); }
  if (institute_id) { where += ` AND institute_id = @institute_id`; request.input("institute_id", sql.BigInt, parseInt(institute_id)); }

  const result = await request.query(`SELECT id FROM bookings ${where}`);

  if (result.recordset.length > 0) {
    return { eligible: false, message: "You already have an active booking" };
  }
  return { eligible: true, message: "You are eligible to book" };
};