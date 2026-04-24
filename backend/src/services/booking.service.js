import { getPool, sql } from "../config/db.js";

export const createBooking = async (userId, body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .input("type", sql.NVarChar, body.booking_type)
    .input("class_id", sql.Int, body.class_id || null)
    .input("trainer_id", sql.Int, body.trainer_id || null)
    .input("institute_id", sql.Int, body.institute_id || null)
    .input("amount", sql.Decimal(10,2), body.amount)
    .query(`
      INSERT INTO bookings (user_id, booking_type, class_id, trainer_id, institute_id, amount)
      OUTPUT INSERTED.*
      VALUES (@user_id, @type, @class_id, @trainer_id, @institute_id, @amount)
    `);

  return result.recordset[0];
};

export const getMyBookings = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`SELECT * FROM bookings WHERE user_id=@user_id`);

  return result.recordset;
};

export const getBookingById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM bookings WHERE id=@id`);

  if (!result.recordset.length) throw new Error("Booking not found");

  return result.recordset[0];
};

export const updateStatus = async (id, status) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE bookings
      SET status=@status, updated_at=GETDATE()
      WHERE id=@id
    `);

  return { id, status };
};

export const getByClass = async (classId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("class_id", sql.Int, classId)
    .query(`SELECT * FROM bookings WHERE class_id=@class_id`);

  return result.recordset;
};

export const getByTrainer = async (trainerId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("trainer_id", sql.Int, trainerId)
    .query(`SELECT * FROM bookings WHERE trainer_id=@trainer_id`);

  return result.recordset;
};

export const getByInstitute = async (instituteId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("institute_id", sql.Int, instituteId)
    .query(`SELECT * FROM bookings WHERE institute_id=@institute_id`);

  return result.recordset;
};

export const checkEligibility = async (userId, body) => {
  const pool = getPool();

  let query = `
    SELECT * FROM bookings 
    WHERE user_id=@user_id
  `;

  if (body.class_id) query += " AND class_id=@class_id";
  if (body.trainer_id) query += " AND trainer_id=@trainer_id";
  if (body.institute_id) query += " AND institute_id=@institute_id";

  const request = pool.request().input("user_id", sql.Int, userId);

  if (body.class_id) request.input("class_id", sql.Int, body.class_id);
  if (body.trainer_id) request.input("trainer_id", sql.Int, body.trainer_id);
  if (body.institute_id) request.input("institute_id", sql.Int, body.institute_id);

  const result = await request.query(query);

  if (result.recordset.length) {
    return { eligible: false, message: "Already booked" };
  }

  return { eligible: true };
};