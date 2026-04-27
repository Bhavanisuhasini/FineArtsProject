import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool, sql } from "../config/db.js";

export const adminLoginService = async ({ username, password }) => {
  const pool = getPool();

  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const result = await pool.request()
    .input("username", sql.NVarChar(100), username)
    .query(`
      SELECT *
      FROM accounts
      WHERE username = @username
        AND role = 'ADMIN'
        AND is_active = 1
    `);

  const admin = result.recordset[0];

  if (!admin) {
    throw new Error("Invalid username or password");
  }
console.log("POSTMAN PASSWORD:", password);
console.log("DB HASH:", admin.password_hash);

const isMatch = await bcrypt.compare(password, admin.password_hash);

console.log("MATCH RESULT:", isMatch);

  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

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
      username: admin.username,
      email: admin.email,
      role: admin.role
    }
  };
};