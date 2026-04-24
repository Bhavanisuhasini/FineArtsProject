import { getPool, sql } from "../config/db.js";

export const createClass = async (userId, body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("title", sql.NVarChar, body.title)
    .input("desc", sql.NVarChar, body.description)
    .input("category_id", sql.Int, body.category_id)
    .input("subcategory_id", sql.Int, body.subcategory_id)
    .input("institute_id", sql.Int, body.institute_id || null)
    .input("trainer_id", sql.Int, body.trainer_id || null)
    .input("price", sql.Decimal(10,2), body.price)
    .input("duration", sql.Int, body.duration_minutes)
    .input("level", sql.NVarChar, body.level)
    .input("created_by", sql.Int, userId)
    .query(`
      INSERT INTO classes 
      (title, description, category_id, subcategory_id, institute_id, trainer_id, price, duration_minutes, level, created_by)
      OUTPUT INSERTED.*
      VALUES (@title, @desc, @category_id, @subcategory_id, @institute_id, @trainer_id, @price, @duration, @level, @created_by)
    `);

  return result.recordset[0];
};

export const getAllClasses = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT * FROM classes
    WHERE is_active = 1 AND status = 'PUBLISHED'
  `);

  return result.recordset;
};

export const getClassById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM classes WHERE id=@id`);

  if (!result.recordset.length) throw new Error("Class not found");

  return result.recordset[0];
};

export const updateClass = async (id, body) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("title", sql.NVarChar, body.title)
    .input("desc", sql.NVarChar, body.description)
    .input("price", sql.Decimal(10,2), body.price)
    .input("duration", sql.Int, body.duration_minutes)
    .query(`
      UPDATE classes
      SET title=@title,
          description=@desc,
          price=@price,
          duration_minutes=@duration,
          updated_at=GETDATE()
      WHERE id=@id
    `);

  return { id, ...body };
};

export const deleteClass = async (id) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .query(`UPDATE classes SET is_active=0 WHERE id=@id`);
};

export const getByInstitute = async (instituteId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, instituteId)
    .query(`SELECT * FROM classes WHERE institute_id=@id`);

  return result.recordset;
};

export const getByTrainer = async (trainerId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, trainerId)
    .query(`SELECT * FROM classes WHERE trainer_id=@id`);

  return result.recordset;
};

export const getByCategory = async (categoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, categoryId)
    .query(`SELECT * FROM classes WHERE category_id=@id`);

  return result.recordset;
};

export const getBySubcategory = async (subcategoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, subcategoryId)
    .query(`SELECT * FROM classes WHERE subcategory_id=@id`);

  return result.recordset;
};

export const getMyClasses = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, userId)
    .query(`SELECT * FROM classes WHERE created_by=@id`);

  return result.recordset;
};

export const addMeetingLink = async (id, link) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("link", sql.NVarChar, link)
    .query(`UPDATE classes SET meeting_link=@link WHERE id=@id`);

  return { id, meeting_link: link };
};

export const changeStatus = async (id, status) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("status", sql.NVarChar, status)
    .query(`UPDATE classes SET status=@status WHERE id=@id`);

  return { id, status };
};