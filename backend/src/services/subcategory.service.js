import { getPool, sql } from "../config/db.js";

export const createSubcategory = async ({ category_id, name, description, image }) => {
  const pool = getPool();

  // check category exists
  const check = await pool.request()
    .input("category_id", sql.Int, category_id)
    .query("SELECT id FROM categories WHERE id = @category_id");

  if (!check.recordset.length) {
    throw new Error("Category not found");
  }

  const result = await pool.request()
    .input("category_id", sql.Int, category_id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description)
    .input("image", sql.NVarChar, image)
    .query(`
      INSERT INTO subcategories (category_id, name, description, image)
      OUTPUT INSERTED.*
      VALUES (@category_id, @name, @description, @image)
    `);

  return result.recordset[0];
};

export const getAllSubcategories = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT sc.*, c.name AS category_name
    FROM subcategories sc
    JOIN categories c ON sc.category_id = c.id
    WHERE sc.is_active = 1
    ORDER BY sc.created_at DESC
  `);

  return result.recordset;
};

export const getSubcategoryById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`
      SELECT sc.*, c.name AS category_name
      FROM subcategories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE sc.id = @id
    `);

  if (!result.recordset.length) {
    throw new Error("Subcategory not found");
  }

  return result.recordset[0];
};

export const getSubcategoriesByCategory = async (categoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("categoryId", sql.Int, categoryId)
    .query(`
      SELECT * FROM subcategories
      WHERE category_id = @categoryId AND is_active = 1
    `);

  return result.recordset;
};

export const updateSubcategory = async (id, { category_id, name, description, image }) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("category_id", sql.Int, category_id)
    .input("name", sql.NVarChar, name)
    .input("description", sql.NVarChar, description)
    .input("image", sql.NVarChar, image)
    .query(`
      UPDATE subcategories
      SET category_id = @category_id,
          name = @name,
          description = @description,
          image = @image,
          updated_at = GETDATE()
      WHERE id = @id
    `);

  return { id, category_id, name, description, image };
};

export const deleteSubcategory = async (id) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .query(`DELETE FROM subcategories WHERE id = @id`);
};