import { getPool, sql } from "../config/db.js";

export const createClassByInstituteService = async (instituteId, body) => {
  const pool = getPool();

  const {
    title,
    description,
    trainer_id,
    category_id,
    subcategory_id,
    price,
    duration,
    level,
    mode,
    max_students,
    meeting_link
  } = body;

  if (!title) throw new Error("title is required");
  if (!category_id) throw new Error("category_id is required");

  const result = await pool.request()
    .input("title", sql.NVarChar(150), title)
    .input("description", sql.NVarChar(1000), description || null)
    .input("institute_id", sql.BigInt, instituteId)
    .input("trainer_id", sql.BigInt, trainer_id || null)
    .input("category_id", sql.BigInt, category_id)
    .input("subcategory_id", sql.BigInt, subcategory_id || null)
    .input("price", sql.Decimal(10, 2), price || 0)
    .input("duration", sql.Int, duration || 30)
    .input("level", sql.NVarChar(20), level || "BEGINNER")
    .input("mode", sql.NVarChar(20), mode || "ONLINE")
    .input("max_students", sql.Int, max_students || null)
    .input("meeting_link", sql.NVarChar(500), meeting_link || null)
    .query(`
      INSERT INTO classes
      (
        title, description, institute_id, trainer_id,
        category_id, subcategory_id, price, duration,
        level, mode, max_students, meeting_link,
        status, is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @title, @description, @institute_id, @trainer_id,
        @category_id, @subcategory_id, @price, @duration,
        @level, @mode, @max_students, @meeting_link,
        'ACTIVE', 1
      )
    `);

  return result.recordset[0];
};

export const createClassByTrainerService = async (trainerId, body) => {
  const pool = getPool();

  const {
    title,
    description,
    category_id,
    subcategory_id,
    price,
    duration,
    level,
    mode,
    max_students,
    meeting_link
  } = body;

  if (!title) throw new Error("title is required");
  if (!category_id) throw new Error("category_id is required");

  const result = await pool.request()
    .input("title", sql.NVarChar(150), title)
    .input("description", sql.NVarChar(1000), description || null)
    .input("institute_id", sql.BigInt, null)
    .input("trainer_id", sql.BigInt, trainerId)
    .input("category_id", sql.BigInt, category_id)
    .input("subcategory_id", sql.BigInt, subcategory_id || null)
    .input("price", sql.Decimal(10, 2), price || 0)
    .input("duration", sql.Int, duration || 30)
    .input("level", sql.NVarChar(20), level || "BEGINNER")
    .input("mode", sql.NVarChar(20), mode || "ONLINE")
    .input("max_students", sql.Int, max_students || null)
    .input("meeting_link", sql.NVarChar(500), meeting_link || null)
    .query(`
      INSERT INTO classes
      (
        title, description, institute_id, trainer_id,
        category_id, subcategory_id, price, duration,
        level, mode, max_students, meeting_link,
        status, is_active
      )
      OUTPUT INSERTED.*
      VALUES
      (
        @title, @description, @institute_id, @trainer_id,
        @category_id, @subcategory_id, @price, @duration,
        @level, @mode, @max_students, @meeting_link,
        'ACTIVE', 1
      )
    `);

  return result.recordset[0];
};