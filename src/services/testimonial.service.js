import sql from "mssql";
import { getPool } from "../config/db.js";

export const getTestimonialsService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
      SELECT *
      FROM testimonials
      WHERE is_active = 1
      ORDER BY id DESC
  `);

  return result.recordset;
};

export const createTestimonialService = async (
  data
) => {
  const pool = getPool();

  const result = await pool
    .request()
    .input(
      "student_name",
      sql.NVarChar,
      data.student_name
    )
    .input(
      "role",
      sql.NVarChar,
      data.role
    )
    .input(
      "testimonial_text",
      sql.NVarChar,
      data.testimonial_text
    )
    .input(
      "rating",
      sql.Int,
      data.rating
    )
    .input(
      "avatar",
      sql.VarChar,
      data.avatar
    )
    .query(`
      INSERT INTO testimonials
      (
        student_name,
        role,
        testimonial_text,
        rating,
        avatar
      )

      OUTPUT INSERTED.*

      VALUES
      (
        @student_name,
        @role,
        @testimonial_text,
        @rating,
        @avatar
      )
    `);

  return result.recordset[0];
};

export const updateTestimonialService = async (
  id,
  data
) => {
  const pool = getPool();

  const result = await pool
    .request()
    .input("id", sql.BigInt, id)
    .input(
      "student_name",
      sql.NVarChar,
      data.student_name
    )
    .input(
      "role",
      sql.NVarChar,
      data.role
    )
    .input(
      "testimonial_text",
      sql.NVarChar,
      data.testimonial_text
    )
    .input(
      "rating",
      sql.Int,
      data.rating
    )
    .input(
      "avatar",
      sql.VarChar,
      data.avatar
    )
    .query(`
      UPDATE testimonials
      SET
        student_name=@student_name,
        role=@role,
        testimonial_text=@testimonial_text,
        rating=@rating,
        avatar=@avatar,
        updated_at=GETDATE()

      WHERE id=@id
    `);

  return result.rowsAffected[0];
};

export const deleteTestimonialService = async (
  id
) => {
  const pool = getPool();

  await pool
    .request()
    .input("id", sql.BigInt, id)
    .query(`
      DELETE FROM testimonials
      WHERE id=@id
    `);
};