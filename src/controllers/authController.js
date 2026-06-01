// import { sql, getPool } from "../config/db.js";

// export const login = async (req, res) => {
//   try {
//     const { uid, email, phone_number } = req.firebaseUser;

//     const role = req.body.role?.toUpperCase() || "USER";

//     const allowedRoles = ["USER", "TRAINER", "INSTITUTE", "ADMIN"];

//     if (!allowedRoles.includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid role. Use USER, TRAINER, INSTITUTE, or ADMIN"
//       });
//     }

//     const pool = getPool();

//     const existing = await pool.request()
//       .input("firebase_uid", sql.NVarChar, uid)
//       .query(`
//         SELECT *
//         FROM accounts
//         WHERE firebase_uid = @firebase_uid
//       `);

//     let account;

//     if (existing.recordset.length === 0) {
//       if (role === "ADMIN") {
//         return res.status(403).json({
//           success: false,
//           message: "Admin account cannot be created from login API"
//         });
//       }

//       const insertResult = await pool.request()
//         .input("firebase_uid", sql.NVarChar, uid)
//         .input("email", sql.NVarChar, email)
//         .input("phone_number", sql.NVarChar, phone_number)
//         .input("role", sql.NVarChar, role)
//         .query(`
//           INSERT INTO accounts
//           (
//             firebase_uid,
//             email,
//             phone_number,
//             role,
//             is_active,
//             is_verified,
//             created_at,
//             updated_at
//           )
//           OUTPUT INSERTED.*
//           VALUES
//           (
//             @firebase_uid,
//             @email,
//             @phone_number,
//             @role,
//             1,
//             1,
//             SYSDATETIME(),
//             SYSDATETIME()
//           )
//         `);

//       account = insertResult.recordset[0];
//     } else {
//       account = existing.recordset[0];

//       if (account.role !== role) {
//         const updateResult = await pool.request()
//           .input("id", sql.BigInt, account.id)
//           .input("role", sql.NVarChar, role)
//           .query(`
//             UPDATE accounts
//             SET role = @role,
//                 updated_at = SYSDATETIME()
//             OUTPUT INSERTED.*
//             WHERE id = @id
//           `);

//         account = updateResult.recordset[0];
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: account
//     });

//   } catch (error) {
//     console.error("Login Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Login failed",
//       error: error.message
//     });
//   }
// };

// export const me = async (req, res) => {
//   return res.status(200).json({
//     success: true,
//     message: "Current user fetched successfully",
//     data: req.account
//   });
// };





import { sql, getPool } from "../config/db.js";

export const login = async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;

    if (!firebaseUser?.uid) {
      return res.status(401).json({
        success: false,
        message: "Firebase user missing. Check Bearer token.",
      });
    }

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || null;
    const phone_number = firebaseUser.phone_number || null;

    const role = req.body.role?.toUpperCase() || "USER";
    const allowedRoles = ["USER", "TRAINER", "INSTITUTE", "ADMIN"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Use USER, TRAINER, INSTITUTE, or ADMIN",
      });
    }

    const pool = getPool();

    const existing = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .query(`
        SELECT *
        FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    let account;

    if (existing.recordset.length === 0) {
      if (role === "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin account cannot be created from login API",
        });
      }

      const insertResult = await pool.request()
        .input("firebase_uid", sql.NVarChar(255), uid)
        .input("email", sql.NVarChar(255), email)
        .input("phone_number", sql.NVarChar(20), phone_number)
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

      account = insertResult.recordset[0];
    } else {
      account = existing.recordset[0];
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: account,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

export const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: req.account,
  });
};