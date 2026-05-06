import jwt from "jsonwebtoken";
import { getPool, sql } from "../config/db.js";

export const adminLoginService = async ({ email, password }) => {
  const pool = getPool();

  const result = await pool.request()
    .input("email", sql.NVarChar, email)
    .query(`
      SELECT *
      FROM accounts
      WHERE email = @email
        AND role = 'ADMIN'
        AND is_active = 1
    `);

  const admin = result.recordset[0];

  if (!admin) {
    throw new Error("Admin not found");
  }

  // ⚠️ simple password check (replace with bcrypt later)
  if (password !== "Admin@123") {
    throw new Error("Invalid credentials");
  }

  // ✅ IMPORTANT: correct payload + same secret
  const token = jwt.sign(
    {
      account_id: admin.id,
      role: "ADMIN"
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }
  };
};