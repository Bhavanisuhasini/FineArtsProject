import { sql, getPool } from "../config/db.js";

export const createOrUpdateProfile = async (req, res) => {
  try {
    const accountId = req.account.id;

    const {
      full_name,
      gender,
      date_of_birth,
      profile_image,
      city,
      state,
      country,
      address,
      pincode
    } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: "Full name is required" });
    }

    const pool = getPool();

    const existing = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query("SELECT id FROM user_profiles WHERE account_id = @account_id");

    const request = pool.request()
      .input("account_id", sql.BigInt, accountId)
      .input("full_name", sql.NVarChar, full_name)
      .input("gender", sql.NVarChar, gender || null)
      .input("date_of_birth", sql.Date, date_of_birth || null)
      .input("profile_image", sql.NVarChar, profile_image || null)
      .input("city", sql.NVarChar, city || null)
      .input("state", sql.NVarChar, state || null)
      .input("country", sql.NVarChar, country || "India")
      .input("address", sql.NVarChar, address || null)
      .input("pincode", sql.NVarChar, pincode || null);

    const result = existing.recordset.length === 0
      ? await request.query(`
          INSERT INTO user_profiles
          (account_id, full_name, gender, date_of_birth, profile_image, city, state, country, address, pincode, is_profile_completed)
          OUTPUT INSERTED.*
          VALUES
          (@account_id, @full_name, @gender, @date_of_birth, @profile_image, @city, @state, @country, @address, @pincode, 1)
        `)
      : await request.query(`
          UPDATE user_profiles
          SET full_name = @full_name,
              gender = @gender,
              date_of_birth = @date_of_birth,
              profile_image = @profile_image,
              city = @city,
              state = @state,
              country = @country,
              address = @address,
              pincode = @pincode,
              is_profile_completed = 1,
              updated_at = SYSDATETIME()
          OUTPUT INSERTED.*
          WHERE account_id = @account_id
        `);

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: result.recordset[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Profile save failed",
      error: error.message
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input("account_id", sql.BigInt, req.account.id)
      .query(`
        SELECT 
          a.id AS account_id,
          a.firebase_uid,
          a.email,
          a.phone_number,
          a.role,
          u.*
        FROM accounts a
        LEFT JOIN user_profiles u ON a.id = u.account_id
        WHERE a.id = @account_id
      `);

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: result.recordset[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Profile fetch failed",
      error: error.message
    });
  }
};