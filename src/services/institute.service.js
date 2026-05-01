import { getPool, sql } from "../config/db.js";

/* ── LOGIN / AUTO-CREATE ────────────────────────────────────────────────── */
export const instituteLoginService = async (firebaseUser) => {
  const pool = getPool();
  const { uid, phone_number, email } = firebaseUser;

  // Upsert account
  let accountResult = await pool.request()
    .input("firebase_uid", sql.NVarChar(255), uid)
    .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);

  let account;
  if (accountResult.recordset.length === 0) {
    const inserted = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .input("phone_number", sql.NVarChar(20), phone_number || null)
      .input("email", sql.NVarChar(255), email || null)
      .query(`
        INSERT INTO accounts (firebase_uid, phone_number, email, role, is_active, is_verified)
        OUTPUT INSERTED.*
        VALUES (@firebase_uid, @phone_number, @email, 'INSTITUTE', 1, 1)
      `);
    account = inserted.recordset[0];
  } else {
    account = accountResult.recordset[0];
  }

  // Upsert institute row
  let instituteResult = await pool.request()
    .input("account_id", sql.BigInt, account.id)
    .query(`SELECT * FROM institutes WHERE account_id = @account_id`);

  let institute;
  if (instituteResult.recordset.length === 0) {
    const inserted = await pool.request()
      .input("account_id", sql.BigInt, account.id)
      .input("phone_number", sql.NVarChar(20), phone_number || null)
      .input("email", sql.NVarChar(255), email || null)
      .query(`
        INSERT INTO institutes (account_id, name, phone_number, email, approval_status, is_active)
        OUTPUT INSERTED.*
        VALUES (@account_id, 'Pending', @phone_number, @email, 'PENDING', 1)
      `);
    institute = inserted.recordset[0];
  } else {
    institute = instituteResult.recordset[0];
  }

  return {
    account,
    institute,
    isProfileCompleted: !!(institute.name && institute.name !== 'Pending' && institute.city),
  };
};

/* ── COMPLETE PROFILE ───────────────────────────────────────────────────── */
export const instituteCompleteProfileService = async (accountId, body) => {
  const pool = getPool();
  const {
    name, description, email, phone_number,
    logo, banner, address, city, state, pincode,
    categories, // [{ category_id, subcategory_id }] max 5
  } = body;

  if (!name || !phone_number || !city) {
    throw new Error("name, phone_number and city are required");
  }

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("name", sql.NVarChar(150), name)
    .input("description", sql.NVarChar(1000), description || null)
    .input("email", sql.NVarChar(255), email || null)
    .input("phone_number", sql.NVarChar(20), phone_number)
    .input("logo", sql.NVarChar(500), logo || null)
    .input("banner", sql.NVarChar(500), banner || null)
    .input("address", sql.NVarChar(500), address || null)
    .input("city", sql.NVarChar(100), city)
    .input("state", sql.NVarChar(100), state || null)
    .input("pincode", sql.NVarChar(20), pincode || null)
    .query(`
      UPDATE institutes SET
        name = @name, description = @description, email = @email,
        phone_number = @phone_number, logo = @logo, banner = @banner,
        address = @address, city = @city, state = @state, pincode = @pincode,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE account_id = @account_id
    `);

  if (result.recordset.length === 0) throw new Error("Institute not found");
  const institute = result.recordset[0];

  // Replace categories
  if (categories && categories.length > 0) {
    await pool.request()
      .input("institute_id", sql.BigInt, institute.id)
      .query(`DELETE FROM institute_categories WHERE institute_id = @institute_id`);

    for (const cat of categories.slice(0, 5)) {
      await pool.request()
        .input("institute_id", sql.BigInt, institute.id)
        .input("category_id", sql.BigInt, parseInt(cat.category_id))
        .input("subcategory_id", sql.BigInt, cat.subcategory_id ? parseInt(cat.subcategory_id) : null)
        .query(`
          INSERT INTO institute_categories (institute_id, category_id, subcategory_id)
          VALUES (@institute_id, @category_id, @subcategory_id)
        `);
    }
  }

  return institute;
};

/* ── GET INSTITUTE PROFILE ──────────────────────────────────────────────── */
export const getInstituteProfileService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT i.*,
        (SELECT COUNT(*) FROM trainers WHERE institute_id = i.id) AS trainer_count,
        (SELECT COUNT(*) FROM classes WHERE institute_id = i.id AND is_active = 1) AS class_count
      FROM institutes i
      WHERE i.account_id = @account_id
    `);

  if (result.recordset.length === 0) throw new Error("Institute not found");

  const institute = result.recordset[0];

  const cats = await pool.request()
    .input("institute_id", sql.BigInt, institute.id)
    .query(`
      SELECT ic.*, c.name AS category_name, s.name AS subcategory_name
      FROM institute_categories ic
      JOIN categories c ON ic.category_id = c.id
      LEFT JOIN subcategories s ON ic.subcategory_id = s.id
      WHERE ic.institute_id = @institute_id
    `);

  return { ...institute, categories: cats.recordset };
};

/* ── LIST ALL INSTITUTES (public) ───────────────────────────────────────── */
export const listInstitutesService = async ({ city, category_id, page = 1, limit = 10 }) => {
  const pool = getPool();
  const offset = (page - 1) * limit;

  let where = `WHERE i.approval_status = 'APPROVED' AND i.is_active = 1`;
  const request = pool.request()
    .input("limit", sql.Int, parseInt(limit))
    .input("offset", sql.Int, offset);

  if (city) {
    where += ` AND i.city LIKE @city`;
    request.input("city", sql.NVarChar(100), `%${city}%`);
  }
  if (category_id) {
    where += ` AND EXISTS (SELECT 1 FROM institute_categories ic WHERE ic.institute_id = i.id AND ic.category_id = @category_id)`;
    request.input("category_id", sql.BigInt, parseInt(category_id));
  }

  const result = await request.query(`
    SELECT i.id, i.name, i.description, i.logo, i.city, i.state,
      i.approval_status, i.created_at,
      (SELECT COUNT(*) FROM classes WHERE institute_id = i.id AND is_active = 1) AS class_count,
      (SELECT COUNT(*) FROM trainers WHERE institute_id = i.id) AS trainer_count
    FROM institutes i
    ${where}
    ORDER BY i.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
};

/* ── INSTITUTE TRAINERS ─────────────────────────────────────────────────── */
export const getInstituteTrainersService = async (instituteId) => {
  const pool = getPool();
  const result = await pool.request()
    .input("institute_id", sql.BigInt, parseInt(instituteId))
    .query(`
      SELECT t.id, t.full_name, t.bio, t.experience_years,
        t.profile_image, t.approval_status, t.is_profile_completed,
        (SELECT COUNT(*) FROM classes WHERE trainer_id = t.id AND is_active = 1) AS class_count
      FROM trainers t
      WHERE t.institute_id = @institute_id AND t.is_active = 1
    `);
  return result.recordset;
};

/* ── APPROVE / REJECT TRAINER (by institute) ────────────────────────────── */
export const updateTrainerApprovalService = async (instituteAccountId, trainerId, status, reason) => {
  const pool = getPool();

  const instResult = await pool.request()
    .input("account_id", sql.BigInt, instituteAccountId)
    .query(`SELECT id FROM institutes WHERE account_id = @account_id`);

  if (instResult.recordset.length === 0) throw new Error("Institute not found");
  const instituteId = instResult.recordset[0].id;

  // Verify trainer belongs to this institute
  const trainerCheck = await pool.request()
    .input("trainer_id", sql.BigInt, parseInt(trainerId))
    .input("institute_id", sql.BigInt, instituteId)
    .query(`SELECT id FROM trainers WHERE id = @trainer_id AND institute_id = @institute_id`);

  if (trainerCheck.recordset.length === 0) throw new Error("Trainer not found in your institute");

  await pool.request()
    .input("trainer_id", sql.BigInt, parseInt(trainerId))
    .input("status", sql.NVarChar(20), status)
    .input("reason", sql.NVarChar(500), reason || null)
    .query(`
      UPDATE trainers SET
        approval_status = @status,
        rejection_reason = @reason,
        updated_at = SYSDATETIME()
      WHERE id = @trainer_id
    `);

  return { trainer_id: trainerId, approval_status: status };
};