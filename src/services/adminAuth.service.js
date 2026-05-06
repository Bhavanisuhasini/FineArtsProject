import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getPool, sql } from "../config/db.js";

const ADMIN_SECRET = "finearts_admin_secret_2026";

export const adminLoginService = async ({ username, email, password }) => {
  const pool = getPool();

  const loginEmail = email || username;

  if (!loginEmail || !password) {
    throw new Error("Email/username and password are required");
  }

  const result = await pool.request()
    .input("email", sql.NVarChar, loginEmail)
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

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      account_id: String(admin.id),
      role: "ADMIN"
    },
    ADMIN_SECRET,
    {
      expiresIn: "7d"
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