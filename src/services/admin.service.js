import { getPool, sql } from "../config/db.js";

/* ── INSTITUTES ─────────────────────────────────────────────────────────── */
export const getPendingInstitutesService = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT i.*, a.phone_number, a.email AS account_email,
      (SELECT COUNT(*) FROM trainers WHERE institute_id = i.id) AS trainer_count
    FROM institutes i
    LEFT JOIN accounts a ON i.account_id = a.id
    WHERE i.approval_status = 'PENDING'
    ORDER BY i.created_at DESC
  `);
  return result.recordset;
};

export const approveInstituteService = async (id) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(id))
    .query(`
      UPDATE institutes SET
        approval_status = 'APPROVED',
        rejection_reason = NULL,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Institute not found");
  return result.recordset[0];
};

export const rejectInstituteService = async (id, reason) => {
  const pool = getPool();
  if (!reason) throw new Error("Rejection reason is required");
  const result = await pool.request()
    .input("id",     sql.BigInt,       parseInt(id))
    .input("reason", sql.NVarChar(500), reason)
    .query(`
      UPDATE institutes SET
        approval_status = 'REJECTED',
        rejection_reason = @reason,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Institute not found");
  return result.recordset[0];
};

/* ── TRAINERS ───────────────────────────────────────────────────────────── */
export const getPendingTrainersService = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT t.*, a.phone_number, a.email AS account_email,
      i.name AS institute_name,
      (SELECT STRING_AGG(c.name, ', ')
       FROM trainer_specializations ts
       JOIN categories c ON ts.category_id = c.id
       WHERE ts.trainer_id = t.id) AS specializations
    FROM trainers t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN institutes i ON t.institute_id = i.id
    WHERE t.approval_status = 'PENDING'
    ORDER BY t.created_at DESC
  `);
  return result.recordset;
};

export const approveTrainerService = async (id) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(id))
    .query(`
      UPDATE trainers SET
        approval_status = 'APPROVED',
        rejection_reason = NULL,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Trainer not found");
  return result.recordset[0];
};

export const rejectTrainerService = async (id, reason) => {
  const pool = getPool();
  if (!reason) throw new Error("Rejection reason is required");
  const result = await pool.request()
    .input("id",     sql.BigInt,       parseInt(id))
    .input("reason", sql.NVarChar(500), reason)
    .query(`
      UPDATE trainers SET
        approval_status = 'REJECTED',
        rejection_reason = @reason,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Trainer not found");
  return result.recordset[0];
};

/* ── CLASSES (independent trainer classes need admin approval) ─────────── */
export const getPendingClassesService = async () => {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT c.*,
      t.full_name AS trainer_name,
      i.name AS institute_name,
      cat.name AS category_name,
      sub.name AS subcategory_name
    FROM classes c
    LEFT JOIN trainers t ON c.trainer_id = t.id
    LEFT JOIN institutes i ON c.institute_id = i.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN subcategories sub ON c.subcategory_id = sub.id
    WHERE c.status = 'DRAFT' AND c.is_active = 1
    ORDER BY c.created_at DESC
  `);
  return result.recordset;
};

export const approveClassService = async (id) => {
  const pool = getPool();
  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(id))
    .query(`
      UPDATE classes SET
        status = 'ACTIVE',
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id AND status = 'DRAFT'
    `);
  if (result.recordset.length === 0) throw new Error("Class not found or already approved");
  return result.recordset[0];
};

export const rejectClassService = async (id, reason) => {
  const pool = getPool();
  if (!reason) throw new Error("Rejection reason is required");
  const result = await pool.request()
    .input("id",     sql.BigInt,       parseInt(id))
    .query(`
      UPDATE classes SET
        status = 'CANCELLED',
        is_active = 0,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);
  if (result.recordset.length === 0) throw new Error("Class not found");
  return result.recordset[0];
};

/* ── ALL INSTITUTES (with filters) ─────────────────────────────────────── */
export const getAllInstitutesService = async ({ status, page = 1, limit = 20 }) => {
  const pool = getPool();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const request = pool.request()
    .input("limit",  sql.Int, parseInt(limit))
    .input("offset", sql.Int, offset);

  let where = `WHERE 1=1`;
  if (status) {
    where += ` AND i.approval_status = @status`;
    request.input("status", sql.NVarChar(20), status);
  }

  const result = await request.query(`
    SELECT i.*,
      (SELECT COUNT(*) FROM trainers WHERE institute_id = i.id) AS trainer_count,
      (SELECT COUNT(*) FROM classes WHERE institute_id = i.id AND is_active = 1) AS class_count
    FROM institutes i
    ${where}
    ORDER BY i.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);
  return result.recordset;
};

/* ── ALL TRAINERS (with filters) ────────────────────────────────────────── */
export const getAllTrainersService = async ({ status, page = 1, limit = 20 }) => {
  const pool = getPool();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const request = pool.request()
    .input("limit",  sql.Int, parseInt(limit))
    .input("offset", sql.Int, offset);

  let where = `WHERE 1=1`;
  if (status) {
    where += ` AND t.approval_status = @status`;
    request.input("status", sql.NVarChar(20), status);
  }

  const result = await request.query(`
    SELECT t.*,
      i.name AS institute_name,
      a.phone_number
    FROM trainers t
    LEFT JOIN institutes i ON t.institute_id = i.id
    LEFT JOIN accounts a ON t.account_id = a.id
    ${where}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);
  return result.recordset;
};