import admin from "../config/firebase.js";
import { getPool, sql } from "../config/db.js";

const firebaseAuth = async (req, res, next) => {
  try {
    // 🔐 Extract token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 🔐 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const firebase_uid = decoded.uid;

    console.log("Firebase UID:", firebase_uid);

    const pool = getPool();

    // ✅ STEP 1: Find user
    let result = await pool.request()
      .input("firebase_uid", sql.NVarChar, firebase_uid)
      .query(`
        SELECT * FROM accounts 
        WHERE firebase_uid = @firebase_uid
      `);

    let account;

    // ✅ STEP 2: Create user if not exists
    if (result.recordset.length === 0) {
      console.log("⚡ Creating new account for:", decoded.email);

      const insertResult = await pool.request()
        .input("firebase_uid", sql.NVarChar, firebase_uid)
        .input("email", sql.NVarChar, decoded.email || null)
        .input("username", sql.NVarChar, decoded.name || decoded.email || "User")
        .input("role", sql.NVarChar, "USER")
        .input("is_active", sql.Bit, 1)
        .input("is_verified", sql.Bit, 1)
        .query(`
          INSERT INTO accounts 
            (firebase_uid, email, username, role, is_active, is_verified)
          OUTPUT INSERTED.*
          VALUES 
            (@firebase_uid, @email, @username, @role, @is_active, @is_verified)
        `);

      account = insertResult.recordset[0];

      console.log("✅ Account created:", account.id);
    } else {
      account = result.recordset[0];
      console.log("✅ Existing account:", account.id);
    }

    // 🚨 CRITICAL: Ensure ID exists
    if (!account?.id) {
      console.error("❌ Account ID missing!");
      return res.status(500).json({ message: "User creation failed" });
    }

    // ✅ Attach to request (VERY IMPORTANT)
    req.user = {
  id: account.id,                // 🔥 IMPORTANT
  firebase_uid: account.firebase_uid,
  email: account.email,
  role: account.role
};

    req.account = req.user; // optional compatibility

    next();

  } catch (err) {
    console.error("🔥 Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default firebaseAuth;
export const requireAuth = firebaseAuth;