import { getPool, sql } from "../config/db.js";

export const createTrainer = async (userId, body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.Int, userId)
    .input("institute_id", sql.Int, body.institute_id || null)
    .input("full_name", sql.NVarChar, body.full_name)
    .input("bio", sql.NVarChar, body.bio)
    .input("exp", sql.Int, body.experience_years)
    .input("email", sql.NVarChar, body.email)
    .input("phone", sql.NVarChar, body.phone_number)
    .query(`
      INSERT INTO trainers (account_id, institute_id, full_name, bio, experience_years, email, phone_number)
      OUTPUT INSERTED.*
      VALUES (@account_id, @institute_id, @full_name, @bio, @exp, @email, @phone)
    `);

  const trainer = result.recordset[0];

  // specializations
  if (body.specializations?.length) {
    for (let sp of body.specializations) {
      await pool.request()
        .input("trainer_id", sql.Int, trainer.id)
        .input("category_id", sql.Int, sp.category_id)
        .input("subcategory_id", sql.Int, sp.subcategory_id)
        .query(`
          INSERT INTO trainer_specializations (trainer_id, category_id, subcategory_id)
          VALUES (@trainer_id, @category_id, @subcategory_id)
        `);
    }
  }

  return trainer;
};

export const getAllTrainers = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT * FROM trainers
    WHERE is_active = 1 AND approval_status = 'APPROVED'
  `);

  return result.recordset;
};

export const getTrainerById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM trainers WHERE id=@id`);

  if (!result.recordset.length) throw new Error("Trainer not found");

  return result.recordset[0];
};

export const updateTrainer = async (id, body) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("full_name", sql.NVarChar, body.full_name)
    .input("bio", sql.NVarChar, body.bio)
    .input("exp", sql.Int, body.experience_years)
    .query(`
      UPDATE trainers
      SET full_name=@full_name,
          bio=@bio,
          experience_years=@exp,
          updated_at=GETDATE()
      WHERE id=@id
    `);

  return { id, ...body };
};

export const uploadTrainerMedia = async (id, body) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("image", sql.NVarChar, body.profile_image)
    .input("cert", sql.NVarChar, body.certificate_url)
    .query(`
      UPDATE trainers
      SET profile_image=@image,
          certificate_url=@cert
      WHERE id=@id
    `);

  return { id, ...body };
};

export const getByInstitute = async (instituteId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("institute_id", sql.Int, instituteId)
    .query(`SELECT * FROM trainers WHERE institute_id=@institute_id`);

  return result.recordset;
};

export const getByCategory = async (categoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("category_id", sql.Int, categoryId)
    .query(`
      SELECT t.*
      FROM trainers t
      JOIN trainer_specializations ts ON t.id = ts.trainer_id
      WHERE ts.category_id = @category_id
    `);

  return result.recordset;
};

export const getBySubcategory = async (subcategoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("subcategory_id", sql.Int, subcategoryId)
    .query(`
      SELECT t.*
      FROM trainers t
      JOIN trainer_specializations ts ON t.id = ts.trainer_id
      WHERE ts.subcategory_id = @subcategory_id
    `);

  return result.recordset;
};

export const getMyTrainer = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.Int, userId)
    .query(`SELECT * FROM trainers WHERE account_id=@account_id`);

  return result.recordset[0];
};

export const deleteTrainer = async (id) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .query(`UPDATE trainers SET is_active=0 WHERE id=@id`);
};