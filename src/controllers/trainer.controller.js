import { getPool, sql } from "../config/db.js";

// ─── LOGIN (auto-create account + trainer row on first visit) ───────────────
export const trainerLogin = async (req, res) => {
  try {
    const { uid, phone_number, email } = req.firebaseUser;
    const pool = getPool();

    let account = req.account;

    if (!account) {
      const insertResult = await pool.request()
        .input("firebase_uid", sql.NVarChar(255), uid)
        .input("phone_number", sql.NVarChar(20), phone_number || null)
        .input("email", sql.NVarChar(255), email || null)
        .input("role", sql.NVarChar(20), "TRAINER")
        .query(`
          INSERT INTO accounts (firebase_uid, phone_number, email, role, is_active, is_verified)
          OUTPUT INSERTED.*
          VALUES (@firebase_uid, @phone_number, @email, @role, 1, 1)
        `);
      account = insertResult.recordset[0];
    }

    // Ensure account_roles row exists
    await pool.request()
      .input("account_id", sql.BigInt, account.id)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM account_roles WHERE account_id = @account_id AND role = 'TRAINER'
        )
        INSERT INTO account_roles (account_id, role, status)
        VALUES (@account_id, 'TRAINER', 'ACTIVE')
      `);

    // Upsert trainer row (full_name placeholder until profile is completed)
    let trainer;
    const existing = await pool.request()
      .input("account_id", sql.BigInt, account.id)
      .query(`SELECT * FROM trainers WHERE account_id = @account_id`);

    if (existing.recordset.length > 0) {
      trainer = existing.recordset[0];
    } else {
      const inserted = await pool.request()
        .input("account_id", sql.BigInt, account.id)
        .input("phone_number", sql.NVarChar(20), phone_number || null)
        .input("email", sql.NVarChar(255), email || null)
        .query(`
          INSERT INTO trainers
            (account_id, full_name, phone_number, email, approval_status, is_profile_completed, is_active)
          OUTPUT INSERTED.*
          VALUES (@account_id, 'Pending', @phone_number, @email, 'PENDING', 0, 1)
        `);
      trainer = inserted.recordset[0];
    }

    res.json({
      success: true,
      message: "Trainer login successful",
      data: {
        account,
        trainer,
        isProfileCompleted: trainer.is_profile_completed === true || trainer.is_profile_completed === 1,
      }
    });

  } catch (e) {
    console.error("Trainer login error:", e.message);
    res.status(400).json({ message: e.message });
  }
};

// ─── COMPLETE PROFILE ────────────────────────────────────────────────────────
export const trainerCompleteProfile = async (req, res) => {
  try {
    const pool = getPool();
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      full_name,
      bio,
      experience_years,
      email,
      phone_number,
      profile_image,
      certificate_url,
      institute_id,
      specializations, // array: [{ category_id, subcategory_id }] — max 3
    } = req.body;

    if (!full_name || !email || !phone_number) {
      return res.status(400).json({ message: "full_name, email and phone_number are required" });
    }

    if (!specializations || specializations.length === 0) {
      return res.status(400).json({ message: "Please select at least one category" });
    }

    if (specializations.length > 3) {
      return res.status(400).json({ message: "You can select up to 3 specializations" });
    }

    // Update trainer row
    const trainerResult = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .input("institute_id", sql.BigInt, institute_id || null)
      .input("full_name", sql.NVarChar(150), full_name)
      .input("bio", sql.NVarChar(1000), bio || null)
      .input("experience_years", sql.Int, parseInt(experience_years) || 0)
      .input("email", sql.NVarChar(255), email)
      .input("phone_number", sql.NVarChar(20), phone_number)
      .input("profile_image", sql.NVarChar(500), profile_image || null)
      .input("certificate_url", sql.NVarChar(500), certificate_url || null)
      .query(`
        UPDATE trainers SET
          institute_id       = @institute_id,
          full_name          = @full_name,
          bio                = @bio,
          experience_years   = @experience_years,
          email              = @email,
          phone_number       = @phone_number,
          profile_image      = @profile_image,
          certificate_url    = @certificate_url,
          is_profile_completed = 1,
          updated_at         = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE account_id = @account_id
      `);

    if (trainerResult.recordset.length === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    const trainer = trainerResult.recordset[0];

    // Replace specializations (delete old, insert new — max 3)
    await pool.request()
      .input("trainer_id", sql.BigInt, trainer.id)
      .query(`DELETE FROM trainer_specializations WHERE trainer_id = @trainer_id`);

    for (const spec of specializations.slice(0, 3)) {
      await pool.request()
        .input("trainer_id", sql.BigInt, trainer.id)
        .input("category_id", sql.BigInt, parseInt(spec.category_id))
        .input("subcategory_id", sql.BigInt, spec.subcategory_id ? parseInt(spec.subcategory_id) : null)
        .query(`
          INSERT INTO trainer_specializations (trainer_id, category_id, subcategory_id)
          VALUES (@trainer_id, @category_id, @subcategory_id)
        `);
    }

    res.json({
      success: true,
      message: "Profile completed successfully",
      data: trainer,
    });

  } catch (e) {
    console.error("Complete profile error:", e.message);
    res.status(400).json({ message: e.message });
  }
};