import { getPool, sql } from "../config/db.js";

export const trainerSignupService = async (firebaseUser, body) => {
  const pool = getPool();
  const { uid, email, phone_number } = firebaseUser;

  const {
    institute_id,
    full_name,
    bio,
    experience_years,
    email: bodyEmail,
    phone_number: bodyPhone,
    profile_image,
    certificate_url,
    category_id,
    subcategory_id,
  } = body;

  if (!full_name) {
    throw new Error("Trainer full_name is required");
  }

  if (!category_id) {
    throw new Error("category_id is required");
  }

  let accountResult = await pool
    .request()
    .input("firebase_uid", sql.NVarChar(255), uid)
    .query(`
      SELECT *
      FROM accounts
      WHERE firebase_uid = @firebase_uid
    `);

  let account;

  if (accountResult.recordset.length === 0) {
    const insertAccount = await pool
      .request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .input("email", sql.NVarChar(255), email || bodyEmail || null)
      .input("phone_number", sql.NVarChar(20), phone_number || bodyPhone || null)
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

    // No role restriction now.
    // Same account can be USER + INSTITUTE + TRAINER.
  }

  await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      IF NOT EXISTS (
        SELECT 1
        FROM account_roles
        WHERE account_id = @account_id
          AND role = 'TRAINER'
      )
      INSERT INTO account_roles (account_id, role, status)
      VALUES (@account_id, 'TRAINER', 'ACTIVE')
    `);

  const trainerCheck = await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      SELECT *
      FROM trainers
      WHERE account_id = @account_id
    `);

  if (trainerCheck.recordset.length > 0) {
    throw new Error("Trainer profile already exists");
  }

  if (institute_id) {
    const instituteCheck = await pool
      .request()
      .input("institute_id", sql.BigInt, institute_id)
      .query(`
        SELECT *
        FROM institutes
        WHERE id = @institute_id
          AND approval_status = 'APPROVED'
          AND is_active = 1
      `);

    if (instituteCheck.recordset.length === 0) {
      throw new Error("Institute not found or not approved");
    }
  }

  const trainerResult = await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .input("institute_id", sql.BigInt, institute_id || null)
    .input("full_name", sql.NVarChar(150), full_name)
    .input("bio", sql.NVarChar(1000), bio || null)
    .input("experience_years", sql.Int, experience_years || 0)
    .input("email", sql.NVarChar(255), bodyEmail || email || null)
    .input("phone_number", sql.NVarChar(20), bodyPhone || phone_number || null)
    .input("profile_image", sql.NVarChar(500), profile_image || null)
    .input("certificate_url", sql.NVarChar(500), certificate_url || null)
    .query(`
      INSERT INTO trainers
      (
        account_id,
        institute_id,
        full_name,
        bio,
        experience_years,
        email,
        phone_number,
        profile_image,
        certificate_url,
        approval_status,
        is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @account_id,
        @institute_id,
        @full_name,
        @bio,
        @experience_years,
        @email,
        @phone_number,
        @profile_image,
        @certificate_url,
        'PENDING',
        1
      )
    `);

  const trainer = trainerResult.recordset[0];

  await pool
    .request()
    .input("trainer_id", sql.BigInt, trainer.id)
    .input("category_id", sql.BigInt, category_id)
    .input("subcategory_id", sql.BigInt, subcategory_id || null)
    .query(`
      INSERT INTO trainer_specializations
      (trainer_id, category_id, subcategory_id)
      VALUES
      (@trainer_id, @category_id, @subcategory_id)
    `);

  return {
    account,
    trainer,
  };
};

export const trainerSigninService = async (accountId) => {
  const pool = getPool();

  const result = await pool
    .request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT *
      FROM trainers
      WHERE account_id = @account_id
        AND is_active = 1
    `);

  if (result.recordset.length === 0) {
    throw new Error("Trainer profile not found");
  }

  return result.recordset[0];
};

export const addTrainerByInstituteService = async (instituteId, body) => {
  const pool = getPool();

  const {
    full_name,
    bio,
    experience_years,
    email,
    phone_number,
    profile_image,
    certificate_url,
    category_id,
    subcategory_id,
  } = body;

  if (!full_name) throw new Error("Trainer full_name is required");
  if (!category_id) throw new Error("category_id is required");

  const trainerResult = await pool
    .request()
    .input("institute_id", sql.BigInt, instituteId)
    .input("full_name", sql.NVarChar(150), full_name)
    .input("bio", sql.NVarChar(1000), bio || null)
    .input("experience_years", sql.Int, experience_years || 0)
    .input("email", sql.NVarChar(255), email || null)
    .input("phone_number", sql.NVarChar(20), phone_number || null)
    .input("profile_image", sql.NVarChar(500), profile_image || null)
    .input("certificate_url", sql.NVarChar(500), certificate_url || null)
    .query(`
      INSERT INTO trainers
      (
        institute_id,
        full_name,
        bio,
        experience_years,
        email,
        phone_number,
        profile_image,
        certificate_url,
        approval_status,
        is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @institute_id,
        @full_name,
        @bio,
        @experience_years,
        @email,
        @phone_number,
        @profile_image,
        @certificate_url,
        'PENDING',
        1
      )
    `);

  const trainer = trainerResult.recordset[0];

  await pool
    .request()
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
};//just for change