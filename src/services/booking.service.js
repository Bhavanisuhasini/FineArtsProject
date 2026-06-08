import { getPool, sql } from "../config/db.js";

/* ── CREATE BOOKING ───────────────────────────── */
export const createBooking = async (accountId, body) => {
  try {
    const pool = getPool();

    const {
      booking_type,
      class_id,
      trainer_id,
      institute_id,
      amount,
      start_date,
      end_date
    } = body;

    if (!booking_type) throw new Error("booking_type is required");
    if (amount === undefined || amount === null)
      throw new Error("amount is required");

    const result = await pool.request()
      .input("user_id", sql.BigInt, accountId)
      .input("booking_type", sql.NVarChar(20), booking_type)
      .input("class_id", sql.BigInt, class_id || null)
      .input("trainer_id", sql.BigInt, trainer_id || null)
      .input("institute_id", sql.BigInt, institute_id || null)
      .input("amount", sql.Decimal(10, 2), Number(amount))
      .input("start_date", sql.DateTime2, start_date || null)
      .input("end_date", sql.DateTime2, end_date || null)
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

  } catch (error) {
    console.error("❌ createBooking:", error.message);
    throw error;
  }
};

/* ── GET MY BOOKINGS ─────────────────────────── */
export const getMyBookings = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT * FROM bookings
      WHERE user_id = @user_id
      ORDER BY created_at DESC
    `);

  return result.recordset;
};

/* ── GET BY ID ──────────────────────────────── */
export const getBookingById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`SELECT * FROM bookings WHERE id = @id`);

  if (!result.recordset.length) {
    throw new Error("Booking not found");
  }

  return result.recordset[0];
};

/* ── UPDATE STATUS ──────────────────────────── */
export const updateStatus = async (id, status) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .input("status", sql.NVarChar(20), status)
    .query(`
      UPDATE bookings
      SET status = @status
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (!result.recordset.length) {
      throw new Error("Booking not found");
  }

  return result.recordset[0];
};

/* ── CHECK ELIGIBILITY ─────────────────────── */
export const checkEligibility = async (accountId, body) => {
  const pool = getPool();
  const { class_id } = body;

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .input("class_id", sql.BigInt, class_id)
    .query(`
      SELECT id FROM bookings
      WHERE user_id = @user_id
      AND class_id = @class_id
      AND status IN ('PENDING', 'CONFIRMED')
    `);

  if (result.recordset.length > 0) {
    return { eligible: false, message: "Already booked" };
  }

  return { eligible: true, message: "Eligible" };
};