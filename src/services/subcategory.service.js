import { getPool, sql } from "../config/db.js";

export const getAllSubcategoriesService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT 
      s.id,
      s.category_id,
      c.name AS category_name,
      s.name,
      s.description,
      s.image_url,
      s.is_active,
      s.created_at,
      s.updated_at
    FROM subcategories s
    INNER JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = 1
    ORDER BY s.id DESC
  `);

  return result.recordset;
};

export const getSubcategoryByIdService = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT 
        s.id,
        s.category_id,
        c.name AS category_name,
        s.name,
        s.description,
        s.image_url,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM subcategories s
      INNER JOIN categories c ON s.category_id = c.id
      WHERE s.id = @id AND s.is_active = 1
    `);

  return result.recordset[0];
};

export const getSubcategoriesByCategoryIdService = async (categoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("categoryId", sql.BigInt, categoryId)
    .query(`
      SELECT 
        s.id,
        s.category_id,
        s.name,
        s.description,
        s.image_url,
        s.is_active,
        s.created_at,
        s.updated_at
      FROM subcategories s
      WHERE s.category_id = @categoryId
        AND s.is_active = 1
      ORDER BY s.id DESC
    `);

  return result.recordset;
};

export const createSubcategoryService = async ({
  category_id,
  name,
  description,
  image_url,
}) => {
  const pool = getPool();

  const categoryCheck = await pool.request()
    .input("category_id", sql.BigInt, category_id)
    .query(`
      SELECT id, name
      FROM categories
      WHERE id = @category_id AND is_active = 1
    `);

  if (categoryCheck.recordset.length === 0) {
    throw new Error("Category not found");
  }

  const existing = await pool.request()
    .input("category_id", sql.BigInt, category_id)
    .input("name", sql.NVarChar(100), name)
    .query(`
      SELECT id
      FROM subcategories
      WHERE category_id = @category_id AND name = @name
    `);

  if (existing.recordset.length > 0) {
    throw new Error("Subcategory already exists under this category");
  }

  const result = await pool.request()
    .input("category_id", sql.BigInt, category_id)
    .input("name", sql.NVarChar(100), name)
    .input("description", sql.NVarChar(500), description || null)
    .input("image_url", sql.NVarChar(500), image_url || null)
    .query(`
      INSERT INTO subcategories (category_id, name, description, image_url)
      OUTPUT INSERTED.*
      VALUES (@category_id, @name, @description, @image_url)
    `);

  return result.recordset[0];
};

export const updateSubcategoryService = async (
  id,
  { category_id, name, description, image_url, is_active }
) => {
  const pool = getPool();

  const checkSubcategory = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT *
      FROM subcategories
      WHERE id = @id
    `);

  if (checkSubcategory.recordset.length === 0) {
    throw new Error("Subcategory not found");
  }

  const oldSubcategory = checkSubcategory.recordset[0];

  const updatedCategoryId = category_id ?? oldSubcategory.category_id;
  const updatedName = name ?? oldSubcategory.name;
  const updatedDescription = description ?? oldSubcategory.description;
  const updatedImageUrl = image_url ?? oldSubcategory.image_url;
  const updatedIsActive =
    typeof is_active === "boolean" ? is_active : oldSubcategory.is_active;

  const categoryCheck = await pool.request()
    .input("category_id", sql.BigInt, updatedCategoryId)
    .query(`
      SELECT id
      FROM categories
      WHERE id = @category_id AND is_active = 1
    `);

  if (categoryCheck.recordset.length === 0) {
    throw new Error("Category not found");
  }

  const duplicate = await pool.request()
    .input("id", sql.BigInt, id)
    .input("category_id", sql.BigInt, updatedCategoryId)
    .input("name", sql.NVarChar(100), updatedName)
    .query(`
      SELECT id
      FROM subcategories
      WHERE category_id = @category_id
        AND name = @name
        AND id <> @id
    `);

  if (duplicate.recordset.length > 0) {
    throw new Error("Another subcategory with this name already exists under this category");
  }

  const result = await pool.request()
    .input("id", sql.BigInt, id)
    .input("category_id", sql.BigInt, updatedCategoryId)
    .input("name", sql.NVarChar(100), updatedName)
    .input("description", sql.NVarChar(500), updatedDescription)
    .input("image_url", sql.NVarChar(500), updatedImageUrl)
    .input("is_active", sql.Bit, updatedIsActive)
    .query(`
      UPDATE subcategories
      SET
        category_id = @category_id,
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

export const deleteSubcategoryService = async (id) => {
  const pool = getPool();

  const checkSubcategory = await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      SELECT *
      FROM subcategories
      WHERE id = @id
    `);

  if (checkSubcategory.recordset.length === 0) {
    throw new Error("Subcategory not found");
  }

  await pool.request()
    .input("id", sql.BigInt, id)
    .query(`
      UPDATE subcategories
      SET
        is_active = 0,
        updated_at = SYSDATETIME()
      WHERE id = @id
    `);

  return true;
};