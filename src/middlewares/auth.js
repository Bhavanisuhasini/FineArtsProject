// 📁 src/middlewares/auth.js

import admin from "../config/firebase.js";
import { getPool, sql } from "../config/db.js";

export const firebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

if (!token) {
  return res.status(401).json({ message: "No token" });
}

    const decoded = await admin.auth().verifyIdToken(token);

    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar, decoded.uid)
      .query("SELECT * FROM accounts WHERE firebase_uid=@firebase_uid");

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    req.account = result.recordset[0];

    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};