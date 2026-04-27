import { getPool, sql } from "../config/db.js";

export const instituteSignupService = async (firebaseUser, body) => {
  const pool = getPool();
  const { uid, email, phone_number } = firebaseUser;

  const {
    name,
    description,
    phone_number: bodyPhone,
    email: bodyEmail,
    logo,
    banner,
    address,
    city,
    state,
    country,
    pincode,
  } = body;

  if (!name) {
    throw new Error("Institute name is required");
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
      .input("role", sql.NVarChar(20), "INSTITUTE")
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

    // no role restriction now
    // same account can become USER + INSTITUTE + TRAINER
  }

  await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      IF NOT EXISTS (
        SELECT 1
        FROM account_roles
        WHERE account_id = @account_id
          AND role = 'INSTITUTE'
      )
      INSERT INTO account_roles (account_id, role, status)
      VALUES (@account_id, 'INSTITUTE', 'ACTIVE')
    `);

  const instituteCheck = await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      SELECT *
      FROM institutes
      WHERE account_id = @account_id
    `);

  if (instituteCheck.recordset.length > 0) {
    throw new Error("Institute profile already exists");
  }

  const instituteResult = await pool
    .request()
    .input("account_id", sql.BigInt, account.id)
    .input("name", sql.NVarChar(150), name)
    .input("description", sql.NVarChar(1000), description || null)
    .input("email", sql.NVarChar(255), bodyEmail || email || null)
    .input("phone_number", sql.NVarChar(20), bodyPhone || phone_number || null)
    .input("logo", sql.NVarChar(500), logo || null)
    .input("banner", sql.NVarChar(500), banner || null)
    .input("address", sql.NVarChar(500), address || null)
    .input("city", sql.NVarChar(100), city || null)
    .input("state", sql.NVarChar(100), state || null)
    .input("country", sql.NVarChar(100), country || "India")
    .input("pincode", sql.NVarChar(20), pincode || null)
    .query(`
      INSERT INTO institutes
      (
        account_id,
        name,
        description,
        email,
        phone_number,
        logo,
        banner,
        address,
        city,
        state,
        country,
        pincode,
        approval_status,
        is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @account_id,
        @name,
        @description,
        @email,
        @phone_number,
        @logo,
        @banner,
        @address,
        @city,
        @state,
        @country,
        @pincode,
        'PENDING',
        1
      )
    `);

  return {
    account,
    institute: instituteResult.recordset[0],
  };
};

export const instituteSigninService = async (accountId) => {
  const pool = getPool();

  const result = await pool
    .request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT *
      FROM institutes
      WHERE account_id = @account_id
        AND is_active = 1
    `);

  if (result.recordset.length === 0) {
    throw new Error("Institute profile not found");
  }

  return result.recordset[0];
};

export const getMyInstituteService = async (accountId) => {
  return instituteSigninService(accountId);
};