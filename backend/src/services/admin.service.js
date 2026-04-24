import { getPool, sql } from "../config/db.js";

/* =========================
   INSTITUTE APPROVALS
========================= */
export const getPendingInstitutes = async () => {
  const pool = getPool();
  const res = await pool.request().query(`
    SELECT * FROM institutes WHERE approval_status='PENDING'
  `);
  return res.recordset;
};

export const updateInstituteApproval = async (id, status) => {
  const pool = getPool();
  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE institutes
      SET approval_status=@status
      WHERE id=@id
    `);
  return { id, status };
};

/* =========================
   TRAINER APPROVALS
========================= */
export const getPendingTrainers = async () => {
  const pool = getPool();
  const res = await pool.request().query(`
    SELECT * FROM trainers WHERE approval_status='PENDING'
  `);
  return res.recordset;
};

export const updateTrainerApproval = async (id, status) => {
  const pool = getPool();
  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE trainers
      SET approval_status=@status
      WHERE id=@id
    `);
  return { id, status };
};

/* =========================
   USER MANAGEMENT
========================= */
export const getAllUsers = async () => {
  const pool = getPool();
  const res = await pool.request().query(`SELECT * FROM accounts`);
  return res.recordset;
};

export const getUserById = async (id) => {
  const pool = getPool();
  const res = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM accounts WHERE id=@id`);
  return res.recordset[0];
};

export const updateUserStatus = async (id, status) => {
  const pool = getPool();
  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`UPDATE accounts SET status=@status WHERE id=@id`);
  return { id, status };
};

/* =========================
   GENERIC GET BY TABLE
========================= */
const getAll = async (table) => {
  const pool = getPool();
  const res = await pool.request().query(`SELECT * FROM ${table}`);
  return res.recordset;
};

const getById = async (table, id) => {
  const pool = getPool();
  const res = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM ${table} WHERE id=@id`);
  return res.recordset[0];
};

const updateStatus = async (table, id, status) => {
  const pool = getPool();
  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`UPDATE ${table} SET status=@status WHERE id=@id`);
  return { id, status };
};

/* =========================
   EXPORTS
========================= */

// Institute mgmt
export const getAllInstitutes = () => getAll("institutes");
export const getInstituteById = (id) => getById("institutes", id);
export const updateInstituteStatus = (id, status) => updateStatus("institutes", id, status);

// Trainer mgmt
export const getAllTrainers = () => getAll("trainers");
export const getTrainerById = (id) => getById("trainers", id);
export const updateTrainerStatus = (id, status) => updateStatus("trainers", id, status);

// Class mgmt
export const getAllClasses = () => getAll("classes");
export const getClassById = (id) => getById("classes", id);
export const updateClassStatus = (id, status) => updateStatus("classes", id, status);

// Booking mgmt
export const getAllBookings = () => getAll("bookings");
export const getBookingById = (id) => getById("bookings", id);

// Payment mgmt
export const getAllPayments = () => getAll("payments");
export const getPaymentById = (id) => getById("payments", id);