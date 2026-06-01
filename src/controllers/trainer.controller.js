import { getPool, sql } from "../config/db.js";

/* =========================================================
   TRAINER LOGIN (MULTI-TRAINER ENABLED - CLEAN)
========================================================= */
export const trainerLogin = async (req, res) => {
  try {
    const { uid, phone_number, email } = req.firebaseUser;
    const pool = getPool();

    let account = req.account;

    /* CREATE ACCOUNT IF NOT EXISTS */
    if (!account) {
      const result = await pool.request()
        .input("firebase_uid", sql.NVarChar(255), uid)
        .input("phone_number", sql.NVarChar(20), phone_number || null)
        .input("email", sql.NVarChar(255), email || null)
        .input("role", sql.NVarChar(20), "TRAINER")
        .query(`
          MERGE accounts AS target
          USING (SELECT @firebase_uid AS firebase_uid) AS source
          ON target.firebase_uid = source.firebase_uid
          WHEN MATCHED THEN
            UPDATE SET role = @role
          WHEN NOT MATCHED THEN
            INSERT (firebase_uid, phone_number, email, role, is_active, is_verified)
            VALUES (@firebase_uid, @phone_number, @email, @role, 1, 1);

          SELECT * FROM accounts WHERE firebase_uid = @firebase_uid;
        `);

      account = result.recordset[0];
    }

    const accountId = account.id;

    /* ENSURE ROLE */
    await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM account_roles
          WHERE account_id = @account_id AND role = 'TRAINER'
        )
        INSERT INTO account_roles (account_id, role, status)
        VALUES (@account_id, 'TRAINER', 'ACTIVE')
      `);

    /* CREATE NEW TRAINER EVERY LOGIN (MULTI-TRAINER) */
    const inserted = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .input("phone_number", sql.NVarChar(20), phone_number || null)
      .input("email", sql.NVarChar(255), email || null)
      .query(`
        INSERT INTO trainers
        (account_id, full_name, phone_number, email, approval_status, is_profile_completed, is_active)
        OUTPUT INSERTED.*
        VALUES (@account_id, 'Pending', @phone_number, @email, 'PENDING', 0, 1)
      `);

    res.json({
      success: true,
      data: {
        account,
        trainer: inserted.recordset[0]
      }
    });

  } catch (err) {
    console.error("trainerLogin error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =========================================================
   COMPLETE TRAINER PROFILE (FIXED MULTI SUPPORT)
========================================================= */
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
      specializations
    } = req.body;

    if (!full_name || !email || !phone_number) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(specializations) || specializations.length === 0) {
      return res.status(400).json({ message: "At least 1 specialization required" });
    }

    /* VALIDATE INSTITUTE */
    if (institute_id) {
      const inst = await pool.request()
        .input("id", sql.BigInt, institute_id)
        .query("SELECT id FROM institutes WHERE id = @id");

      if (!inst.recordset.length) {
        return res.status(400).json({ message: "Invalid institute_id" });
      }
    }

    /* GET LATEST TRAINER (IMPORTANT FIX) */
    const trainerResult = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`
        SELECT TOP 1 id
        FROM trainers
        WHERE account_id = @account_id
        ORDER BY created_at DESC
      `);

    if (!trainerResult.recordset.length) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    const trainerId = trainerResult.recordset[0].id;

    /* UPDATE TRAINER */
    const updated = await pool.request()
      .input("trainer_id", sql.BigInt, trainerId)
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
          institute_id = @institute_id,
          full_name = @full_name,
          bio = @bio,
          experience_years = @experience_years,
          email = @email,
          phone_number = @phone_number,
          profile_image = @profile_image,
          certificate_url = @certificate_url,
          is_profile_completed = 1,
          updated_at = SYSDATETIME()
        OUTPUT INSERTED.*
        WHERE id = @trainer_id
      `);

    const trainer = updated.recordset[0];

    /* DELETE OLD SPECIALIZATIONS */
    await pool.request()
      .input("trainer_id", sql.BigInt, trainerId)
      .query(`DELETE FROM trainer_specializations WHERE trainer_id = @trainer_id`);

    /* INSERT NEW SPECIALIZATIONS */
    for (const spec of specializations.slice(0, 3)) {
      if (!spec?.category_id) continue;

      await pool.request()
        .input("trainer_id", sql.BigInt, trainerId)
        .input("category_id", sql.BigInt, parseInt(spec.category_id))
        .input("subcategory_id", sql.BigInt, spec.subcategory_id ? parseInt(spec.subcategory_id) : null)
        .query(`
          INSERT INTO trainer_specializations
          (trainer_id, category_id, subcategory_id)
          VALUES (@trainer_id, @category_id, @subcategory_id)
        `);
    }

    res.json({
      success: true,
      data: trainer
    });

  } catch (err) {
    console.error("trainerCompleteProfile error:", err);
    res.status(500).json({ message: err.message });
  }
};



/* =========================================================
   GET ALL TRAINERS
========================================================= */
export const getAllTrainers = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT
          t.id,
          t.account_id,
          t.institute_id,
          t.full_name,
          t.bio,
          t.experience_years,
          t.email,
          t.phone_number,
          t.profile_image,
          t.certificate_url,
          t.rating,
          t.total_reviews,
          t.approval_status,
          t.is_profile_completed,
          t.is_active,
          t.created_at,
          t.updated_at,

          ISNULL((
            SELECT COUNT(*)
            FROM bookings b
            WHERE b.trainer_id = t.id
            AND b.status = 'CONFIRMED'
          ),0) AS total_students,

          STRING_AGG(sc.name, ', ') AS subcategories

      FROM trainers t

      LEFT JOIN trainer_specializations ts
      ON ts.trainer_id = t.id

      LEFT JOIN subcategories sc
      ON sc.id = ts.subcategory_id

      WHERE t.is_active = 1

      GROUP BY
          t.id,
          t.account_id,
          t.institute_id,
          t.full_name,
          t.bio,
          t.experience_years,
          t.email,
          t.phone_number,
          t.profile_image,
          t.certificate_url,
          t.rating,
          t.total_reviews,
          t.approval_status,
          t.is_profile_completed,
          t.is_active,
          t.created_at,
          t.updated_at

      ORDER BY t.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });

  } catch (err) {
    console.error("getAllTrainers error:", err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};



/* =========================================================
   GET MY TRAINERS (MULTI SUPPORT)
========================================================= */
export const getMyTrainerProfile = async (req, res) => {
  try {
    const pool = getPool();
    const accountId = req.account?.id;

    const result = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`
        SELECT *
        FROM trainers
        WHERE account_id = @account_id
        ORDER BY created_at DESC
      `);

    return res.json({
      success: true,
      data: result.recordset
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =========================================================
   PUBLIC PROFILE
========================================================= */
export const getTrainerPublicProfile = async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const result = await pool.request()
      .input("id", sql.BigInt, id)
      .query(`
        SELECT
          t.*,
          i.name AS institute_name,
          STRING_AGG(sc.name, ', ') AS subcategories
        FROM trainers t
        LEFT JOIN institutes i
          ON t.institute_id = i.id
        LEFT JOIN trainer_specializations ts
          ON ts.trainer_id = t.id
        LEFT JOIN subcategories sc
          ON sc.id = ts.subcategory_id
        WHERE t.id = @id
        GROUP BY
          t.id,
          t.account_id,
          t.institute_id,
          t.full_name,
          t.bio,
          t.experience_years,
          t.email,
          t.phone_number,
          t.profile_image,
          t.certificate_url,
          t.approval_status,
          t.rejection_reason,
          t.is_active,
          t.created_at,
          t.updated_at,
          t.is_profile_completed,
          t.qr_image_url,
          t.upi_id,
          t.rating,
          t.total_reviews,
          t.max_students,
          t.specialty,
          t.languages,
          t.certifications,
          t.skills,
          t.schedule,
          t.response_rate,
          t.total_students,
          i.name
      `);

    if (!result.recordset.length) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error("getTrainerPublicProfile error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =========================================================
   UPDATE QR / UPI
========================================================= */
export const updateTrainerQR = async (req, res) => {
  try {
    const pool = getPool();
    const accountId = req.account.id;
    const { qr_image_url, upi_id } = req.body;

    const result = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`
        UPDATE trainers SET
          qr_image_url = @qr_image_url,
          upi_id = @upi_id
        OUTPUT INSERTED.*
        WHERE id = (
          SELECT TOP 1 id FROM trainers
          WHERE account_id = @account_id
          ORDER BY created_at DESC
        )
      `);

    res.json({ success: true, data: result.recordset[0] });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTrainer = async (req, res) => {
  try {
    const pool = getPool();
    const accountId = req.account.id;

    const {
      full_name,
      email,
      phone_number
    } = req.body;

    const result = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .input("full_name", sql.NVarChar(150), full_name)
      .input("email", sql.NVarChar(255), email || null)
      .input("phone_number", sql.NVarChar(20), phone_number || null)
      .query(`
        INSERT INTO trainers (
          account_id,
          full_name,
          email,
          phone_number,
          approval_status,
          is_profile_completed,
          is_active,
          created_at
        )
        OUTPUT INSERTED.*
        VALUES (
          @account_id,
          @full_name,
          @email,
          @phone_number,
          'PENDING',
          0,
          1,
          SYSDATETIME()
        )
      `);

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};