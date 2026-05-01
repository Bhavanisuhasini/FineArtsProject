import admin from "../config/firebase.js";
import { getPool, sql } from "../config/db.js";

export const firebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = decoded;

    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar, decoded.uid)
      .query(`SELECT * FROM accounts WHERE firebase_uid=@firebase_uid`);

    req.account = result.recordset[0];

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireAuth = firebaseAuth;