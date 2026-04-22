import { getPool, sql } from "../config/db.js";

export const getAllCategoriesService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT 
      id,
      name,
      description,
      image_url,
      is_active,
      created_at,
      updated_at
    FROM categories
    WHERE is_active = 1
    ORDER BY id DESC
  `);

  return result.recordset;
};

export const getCategoryByIdService = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT 
        id,
        name,
        description,
        image_url,
        is_active,
        created_at,
        updated_at
      FROM categories
      WHERE id = @id AND is_active = 1
    `);

  return result.recordset[0];
};

export const createCategoryService = async ({ name, description, image_url }) => {
  const pool = getPool();

  const existing = await pool.request()
    .input("name", sql.NVarChar(100), name)
    .query(`
      SELECT id, name
      FROM categories
      WHERE name = @name
    `);

  if (existing.recordset.length > 0) {
    throw new Error("Category already exists");
  }

  const result = await pool.request()
    .input("name", sql.NVarChar(100), name)
    .input("description", sql.NVarChar(500), description || null)
    .input("image_url", sql.NVarChar(500), image_url || null)
    .query(`
      INSERT INTO categories (name, description, image_url)
      OUTPUT INSERTED.*
      VALUES (@name, @description, @image_url)
    `);

  return result.recordset[0];
};

export const updateCategoryService = async (id, { name, description, image_url, is_active }) => {
  const pool = getPool();

  const checkCategory = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT *
      FROM categories
      WHERE id = @id
    `);

  if (checkCategory.recordset.length === 0) {
    throw new Error("Category not found");
  }

  if (name) {
    const duplicate = await pool.request()
      .input("id", sql.BigInt, id)
      .input("name", sql.NVarChar(100), name)
      .query(`
        SELECT id
        FROM categories
        WHERE name = @name AND id <> @id
      `);

    if (duplicate.recordset.length > 0) {
      throw new Error("Another category with this name already exists");
    }
  }

  const oldCategory = checkCategory.recordset[0];

  const updatedName = name ?? oldCategory.name;
  const updatedDescription = description ?? oldCategory.description;
  const updatedImageUrl = image_url ?? oldCategory.image_url;
  const updatedIsActive = typeof is_active === "boolean" ? is_active : oldCategory.is_active;

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .input("name", sql.NVarChar(100), updatedName)
    .input("description", sql.NVarChar(500), updatedDescription)
    .input("image_url", sql.NVarChar(500), updatedImageUrl)
    .input("is_active", sql.Bit, updatedIsActive)
    .query(`
      UPDATE categories
      SET
        name = @name,
        description = @description,
        image_url = @image_url,
        is_active = @is_active,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  return result.recordset[0];
};

export const deleteCategoryService = async (id) => {
  const pool = getPool();

  const checkCategory = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT *
      FROM categories
      WHERE id = @id
    `);

  if (checkCategory.recordset.length === 0) {
    throw new Error("Category not found");
  }

  await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      UPDATE categories
      SET
        is_active = 0,
        updated_at = SYSDATETIME()
      WHERE id = @id
    `);

  return true;
};