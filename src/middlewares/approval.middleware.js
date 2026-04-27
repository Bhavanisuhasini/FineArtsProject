import { getPool, sql } from "../config/db.js";

export const requireApprovedInstitute = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query(`
      SELECT * FROM institutes 
      WHERE account_id=@account_id AND approval_status='APPROVED'
    `);

  if (result.recordset.length === 0) {
    return res.status(403).json({ message: "Institute not approved" });
  }

  req.institute = result.recordset[0];
  next();
};

export const requireApprovedTrainer = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query(`
      SELECT * FROM trainers 
      WHERE account_id=@account_id AND approval_status='APPROVED'
    `);

  if (result.recordset.length === 0) {
    return res.status(403).json({ message: "Trainer not approved" });
  }

  req.trainer = result.recordset[0];
  next();
};