import { getPool, sql } from "../config/db.js";

export const trainerSignupService = async (firebaseUser, body) => {
  const pool = getPool();
  const { uid, email, phone_number } = firebaseUser;

  let accountResult = await pool.request()
    .input("firebase_uid", sql.NVarChar(255), uid)
    .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);

  let account;

  if (accountResult.recordset.length === 0) {
    const insertAccount = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .input("email", sql.NVarChar(255), email || body.email || null)
      .input("phone_number", sql.NVarChar(20), phone_number || body.phone_number || null)
      .input("role", sql.NVarChar(20), "TRAINER")
      .query(`
        INSERT INTO accounts
        (firebase_uid, email, phone_number, role, is_active, is_verified)
        OUTPUT INSERTED.*
        VALUES
        (@firebase_uid, @email, @phone_number, @role, 1, 1)
      `);

    account = insertAccount.recordset[0];
  } else {
    account = accountResult.recordset[0];
  }

  await pool.request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM account_roles
        WHERE account_id = @account_id AND role = 'TRAINER'
      )
      INSERT INTO account_roles (account_id, role, status)
      VALUES (@account_id, 'TRAINER', 'ACTIVE')
    `);

  const existing = await pool.request()
    .input("account_id", sql.BigInt, account.id)
    .query(`SELECT * FROM trainers WHERE account_id = @account_id`);

  if (existing.recordset.length > 0) {
    return {
      account,
      trainer: existing.recordset[0]
    };
  }

  const result = await pool.request()
    .input("account_id", sql.BigInt, account.id)
    .input("full_name", sql.NVarChar(150), body.full_name || null)
    .input("email", sql.NVarChar(255), body.email || email || null)
    .input("phone_number", sql.NVarChar(20), body.phone_number || phone_number || null)
    .query(`
      INSERT INTO trainers
      (
        account_id, full_name, email, phone_number,
        approval_status, is_profile_completed, is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @account_id, @full_name, @email, @phone_number,
        'PENDING', 0, 1
      )
    `);

  return {
    account,
    trainer: result.recordset[0]
  };
};

export const trainerSigninService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT * FROM trainers
      WHERE account_id = @account_id
    `);

  if (result.recordset.length === 0) {
    throw new Error("Trainer profile not found. Please signup first.");
  }

  return result.recordset[0];
};

export const completeTrainerProfileService = async (accountId, body) => {
  const pool = getPool();

  const {
    institute_id,
    full_name,
    bio,
    experience_years,
    email,
    phone_number,
    profile_image,
    certificate_url,
    category_id,
    subcategory_id
  } = body;

  if (!full_name || !email || !phone_number || !category_id) {
    throw new Error("Please fill all required trainer profile fields");
  }

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("institute_id", sql.BigInt, institute_id || null)
    .input("full_name", sql.NVarChar(150), full_name)
    .input("bio", sql.NVarChar(1000), bio || null)
    .input("experience_years", sql.Int, experience_years || 0)
    .input("email", sql.NVarChar(255), email)
    .input("phone_number", sql.NVarChar(20), phone_number)
    .input("profile_image", sql.NVarChar(500), profile_image || null)
    .input("certificate_url", sql.NVarChar(500), certificate_url || null)
    .query(`
      UPDATE trainers
      SET
        institute_id = @institute_id,
        full_name = @full_name,
        bio = @bio,
        experience_years = @experience_years,
        email = @email,
        phone_number = @phone_number,
        profile_image = @profile_image,
        certificate_url = @certificate_url,
        is_profile_completed = 1,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE account_id = @account_id
    `);

  if (trainerResult.recordset.length === 0) {
    throw new Error("Trainer profile not found");
  }

  const trainer = trainerResult.recordset[0];

  await pool.request()
    .input("trainer_id", sql.BigInt, trainer.id)
    .query(`DELETE FROM trainer_specializations WHERE trainer_id = @trainer_id`);

  await pool.request()
    .input("trainer_id", sql.BigInt, trainer.id)
    .input("category_id", sql.BigInt, category_id)
    .input("subcategory_id", sql.BigInt, subcategory_id || null)
    .query(`
      INSERT INTO trainer_specializations
      (trainer_id, category_id, subcategory_id)
      VALUES
      (@trainer_id, @category_id, @subcategory_id)
    `);

  return trainer;
};