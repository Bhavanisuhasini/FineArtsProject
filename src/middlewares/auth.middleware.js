import admin from "../config/firebase.js";
import { getPool, sql } from "../config/db.js";

export const firebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const attachAccount = async (req, res, next) => {
  const pool = getPool();

  const result = await pool.request()
    .input("uid", sql.NVarChar, req.firebaseUser.uid)
    .query("SELECT * FROM accounts WHERE firebase_uid=@uid");

  if (result.recordset.length === 0) {
    return res.status(401).json({ message: "Account not found" });
  }

  req.account = result.recordset[0];

  // get roles
  const roles = await pool.request()
    .input("account_id", sql.BigInt, req.account.id)
    .query("SELECT role FROM account_roles WHERE account_id=@account_id");

  req.roles = roles.recordset.map(r => r.role);

  next();
};

export const requireAuth = [firebaseAuth, attachAccount];