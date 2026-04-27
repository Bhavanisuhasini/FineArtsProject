import { getPool, sql } from "../config/db.js";

export const getPendingInstitutesService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT * FROM institutes
    WHERE approval_status = 'PENDING'
    ORDER BY id DESC
  `);

  return result.recordset;
};

export const approveInstituteService = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      UPDATE institutes
      SET approval_status = 'APPROVED',
          rejection_reason = NULL,
          updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new Error("Institute not found");
  }

  return result.recordset[0];
};

export const rejectInstituteService = async (id, reason) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .input("reason", sql.NVarChar(500), reason || null)
    .query(`
      UPDATE institutes
      SET approval_status = 'REJECTED',
          rejection_reason = @reason,
          updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new Error("Institute not found");
  }

  return result.recordset[0];
};

export const getPendingTrainersService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT * FROM trainers
    WHERE approval_status = 'PENDING'
    ORDER BY id DESC
  `);

  return result.recordset;
};

export const approveTrainerService = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      UPDATE trainers
      SET approval_status = 'APPROVED',
          rejection_reason = NULL,
          updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new Error("Trainer not found");
  }

  return result.recordset[0];
};

export const rejectTrainerService = async (id, reason) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .input("reason", sql.NVarChar(500), reason || null)
    .query(`
      UPDATE trainers
      SET approval_status = 'REJECTED',
          rejection_reason = @reason,
          updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  if (result.recordset.length === 0) {
    throw new Error("Trainer not found");
  }

  return result.recordset[0];
};