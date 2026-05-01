import { getPool, sql } from "../config/db.js";

export const requireCompletedUserProfile = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query(`
      SELECT * FROM user_profiles
      WHERE account_id = @account_id
        AND is_profile_completed = 1
    `);

  if (result.recordset.length === 0) {
    return res.status(403).json({
      success: false,
      message: "Please complete your user profile first"
    });
  }

  req.userProfile = result.recordset[0];
  next();
};

export const requireCompletedInstituteProfile = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query(`
      SELECT * FROM institutes
      WHERE account_id = @account_id
        AND is_profile_completed = 1
        AND is_active = 1
    `);

  if (result.recordset.length === 0) {
    return res.status(403).json({
      success: false,
      message: "Please complete your institute profile first"
    });
  }

  req.institute = result.recordset[0];
  next();
};

export const requireCompletedTrainerProfile = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query(`
      SELECT * FROM trainers
      WHERE account_id = @account_id
        AND is_profile_completed = 1
        AND is_active = 1
    `);

  if (result.recordset.length === 0) {
    return res.status(403).json({
      success: false,
      message: "Please complete your trainer profile first"
    });
  }

  req.trainer = result.recordset[0];
  next();
};