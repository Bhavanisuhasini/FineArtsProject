// import { getPool, sql } from "../config/db.js";

// export const accountAuth = async (req, res, next) => {
//   try {
//     const { uid } = req.firebaseUser;

//     const pool = getPool();

//     const result = await pool.request()
//       .input("firebase_uid", sql.NVarChar, uid)
//       .query(`
//         SELECT *
//         FROM accounts
//         WHERE firebase_uid = @firebase_uid
//       `);

//     if (result.recordset.length === 0) {
//       return res.status(401).json({
//         success: false,
//         message: "Account not found. Please login first."
//       });
//     }

//     req.account = result.recordset[0];

//     next();
//   } catch (error) {
//     console.error("Account Auth Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Account authentication failed",
//       error: error.message
//     });
//   }
// };


import { getPool, sql } from "../config/db.js";

export const accountAuth = async (req, res, next) => {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser?.uid) {
      return res.status(401).json({
        success: false,
        message: "Firebase user missing",
      });
    }

    const pool = getPool();

    const result = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), firebaseUser.uid)
      .query(`
        SELECT *
        FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    if (result.recordset.length === 0) {
      const role = req.body.role?.toUpperCase() || "USER";

      const inserted = await pool.request()
        .input("firebase_uid", sql.NVarChar(255), firebaseUser.uid)
        .input("email", sql.NVarChar(255), firebaseUser.email || null)
        .input("phone_number", sql.NVarChar(20), firebaseUser.phone_number || null)
        .input("role", sql.NVarChar(50), role)
        .query(`
          INSERT INTO accounts
          (
            firebase_uid,
            email,
            phone_number,
            role,
            is_active,
            is_verified,
            created_at,
            updated_at
          )
          OUTPUT INSERTED.*
          VALUES
          (
            @firebase_uid,
            @email,
            @phone_number,
            @role,
            1,
            1,
            SYSDATETIME(),
            SYSDATETIME()
          )
        `);

      req.account = inserted.recordset[0];
    } else {
      req.account = result.recordset[0];
    }

    next();
  } catch (error) {
    console.error("Account Auth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Account authentication failed",
      error: error.message,
    });
  }
};

export default accountAuth;