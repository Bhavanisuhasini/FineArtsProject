import { getPool, sql } from "../config/db.js";

export const createCategory = async ({ name, description, image }) => {
  const pool = getPool();

  const result = await pool.request()
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description)
    .input("image", sql.NVarChar, image)
    .query(`
      INSERT INTO categories (name, description, image)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @image)
    `);

  return result.recordset[0];
};

export const getAllCategories = async () => {
  const pool = getPool();

  const result = await pool.request()
    .query(`SELECT * FROM categories WHERE is_active = 1 ORDER BY created_at DESC`);

  return result.recordset;
};

export const getCategoryById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM categories WHERE id = @id`);

  if (!result.recordset.length) {
    throw new Error("Category not found");
  }

  return result.recordset[0];
};

export const updateCategory = async (id, { name, description, image }) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description)
    .input("image", sql.NVarChar, image)
    .query(`
      UPDATE categories
      SET name = @name,
          description = @description,
          image = @image,
          updated_at = GETDATE()
      WHERE id = @id
    `);

  return { id, name, description, image };
};

export const deleteCategory = async (id) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .query(`DELETE FROM categories WHERE id = @id`);
};