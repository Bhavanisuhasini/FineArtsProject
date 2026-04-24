import { getPool, sql } from "../config/db.js";

export const createInstitute = async (userId, body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.Int, userId)
    .input("name", sql.NVarChar, body.name)
    .input("description", sql.NVarChar, body.description)
    .input("email", sql.NVarChar, body.email)
    .input("phone", sql.NVarChar, body.phone_number)
    .input("city", sql.NVarChar, body.city)
    .input("state", sql.NVarChar, body.state)
    .query(`
      INSERT INTO institutes (account_id, name, description, email, phone_number, city, state)
      OUTPUT INSERTED.*
      VALUES (@account_id, @name, @description, @email, @phone, @city, @state)
    `);

  return result.recordset[0];
};

export const getAllInstitutes = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT * FROM institutes
    WHERE is_active = 1 AND approval_status = 'APPROVED'
  `);

  return result.recordset;
};

export const getInstituteById = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM institutes WHERE id = @id`);

  if (!result.recordset.length) throw new Error("Institute not found");

  return result.recordset[0];
};

export const updateInstitute = async (id, body) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("name", sql.NVarChar, body.name)
    .input("description", sql.NVarChar, body.description)
    .input("city", sql.NVarChar, body.city)
    .input("state", sql.NVarChar, body.state)
    .query(`
      UPDATE institutes
      SET name=@name, description=@description,
          city=@city, state=@state,
          updated_at=GETDATE()
      WHERE id=@id
    `);

  return { id, ...body };
};

export const uploadMedia = async (id, body) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .input("logo", sql.NVarChar, body.logo)
    .input("banner", sql.NVarChar, body.banner)
    .query(`
      UPDATE institutes
      SET logo=@logo, banner=@banner
      WHERE id=@id
    `);

  return { id, ...body };
};

export const getMyInstitute = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.Int, userId)
    .query(`SELECT * FROM institutes WHERE account_id=@account_id`);

  return result.recordset[0];
};

export const getByCategory = async (categoryId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("category_id", sql.Int, categoryId)
    .query(`
      SELECT i.*
      FROM institutes i
      JOIN institute_categories ic ON i.id = ic.institute_id
      WHERE ic.category_id = @category_id
    `);

  return result.recordset;
};

export const filterInstitutes = async ({ city, state }) => {
  const pool = getPool();

  const result = await pool.request()
    .input("city", sql.NVarChar, city || null)
    .input("state", sql.NVarChar, state || null)
    .query(`
      SELECT * FROM institutes
      WHERE (@city IS NULL OR city=@city)
      AND (@state IS NULL OR state=@state)
    `);

  return result.recordset;
};

export const deleteInstitute = async (id) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.Int, id)
    .query(`UPDATE institutes SET is_active=0 WHERE id=@id`);
};