


import { getPool, sql } from "../config/db.js";

/* ─────────────────────────────────────────────
   LOGIN / AUTO-CREATE ACCOUNT + FETCH INSTITUTES
───────────────────────────────────────────── */
export const instituteLoginService = async (firebaseUser) => {
  const pool = getPool();
  const { uid, phone_number, email } = firebaseUser;

  let accountResult = await pool.request()
    .input("firebase_uid", sql.NVarChar(255), uid)
    .query(`
      SELECT *
      FROM accounts
      WHERE firebase_uid = @firebase_uid
    `);

  let account;

  // CREATE ACCOUNT IF NOT EXISTS
  if (accountResult.recordset.length === 0) {

    await pool.request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .input("phone_number", sql.NVarChar(20), phone_number || null)
      .input("email", sql.NVarChar(255), email || null)
      .query(`
        INSERT INTO accounts (
          firebase_uid,
          phone_number,
          email,
          role,
          is_active,
          is_verified
        )
        VALUES (
          @firebase_uid,
          @phone_number,
          @email,
          'INSTITUTE',
          1,
          1
        )
      `);

    const inserted = await pool.request()
      .input("firebase_uid", sql.NVarChar(255), uid)
      .query(`
        SELECT *
        FROM accounts
        WHERE firebase_uid = @firebase_uid
      `);

    account = inserted.recordset[0];

  } else {
    account = accountResult.recordset[0];
  }

  // FETCH INSTITUTES
  const institutesResult = await pool.request()
    .input("account_id", sql.BigInt, account.id)
    .query(`
      SELECT *
      FROM institutes
      WHERE account_id = @account_id
      ORDER BY created_at DESC
    `);

  return {
    account,
    institutes: institutesResult.recordset,
  };
};


/* ─────────────────────────────────────────────
   CREATE INSTITUTE
───────────────────────────────────────────── */
export const createInstituteService = async (
  accountId,
  body = {}
) => {

  const pool = getPool();

  const {
    name = "New Institute",
    description = null,
    email = null,
    phone_number = null,
  
    address = null,
    city = null,
    state = null,
    pincode = null,
    image_url = null,
    distance = null,
    rating = null,
    reviews = null,
    timing = null,
    categories = [],
  } = body;

  // ================= CREATE INSTITUTE =================
  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("name", sql.NVarChar(150), name)
    .input("description", sql.NVarChar(1000), description)
    .input("email", sql.NVarChar(255), email)
    .input("phone_number", sql.NVarChar(20), phone_number)
   
    .input("address", sql.NVarChar(500), address)
    .input("city", sql.NVarChar(100), city)
    .input("state", sql.NVarChar(100), state)
    .input("pincode", sql.NVarChar(20), pincode)
    .input("image_url", sql.NVarChar(500), image_url)
    .input("distance", sql.NVarChar(50), distance)
    .input("rating", sql.Float, rating)
    .input("reviews", sql.Int, reviews)
    .input("timing", sql.NVarChar(100), timing)

    .query(`
      INSERT INTO institutes (
        account_id,
        name,
        description,
        email,
        phone_number,
     
        address,
        city,
        state,
        pincode,
        image_url,
        distance,
        rating,
        reviews,
        timing,
        approval_status,
        is_active
      )

      OUTPUT INSERTED.*

      VALUES (
        @account_id,
        @name,
        @description,
        @email,
        @phone_number,
     
      
        @address,
        @city,
        @state,
        @pincode,
        @image_url,
        @distance,
        @rating,
        @reviews,
        @timing,
        'APPROVED',
        1
      )
    `);

  const institute = result.recordset[0];

  // ================= INSERT CATEGORIES =================
  if (categories && categories.length > 0) {

    for (const cat of categories) {

      await pool.request()
        .input(
          "institute_id",
          sql.BigInt,
          institute.id
        )
        .input(
          "category_id",
          sql.BigInt,
          parseInt(cat.category_id)
        )
        .input(
          "subcategory_id",
          sql.BigInt,
          cat.subcategory_id
            ? parseInt(cat.subcategory_id)
            : null
        )
        .query(`
          INSERT INTO institute_categories (
            institute_id,
            category_id,
            subcategory_id
          )
          VALUES (
            @institute_id,
            @category_id,
            @subcategory_id
          )
        `);
    }
  }

  return institute;
};
/* ─────────────────────────────────────────────
   COMPLETE PROFILE
───────────────────────────────────────────── */

export const instituteCompleteProfileService = async (
  accountId,
  body
) => {
  const pool = getPool();

  const {
    name,
    description,
    email,
    phone_number,
    address,
    city,
    state,
    pincode,
    categories,
    distance,
    rating,
    reviews,
    timing,
  } = body;


 

  if (!name || !phone_number || !city) {
    throw new Error(
      "name, phone_number and city are required"
    );
  }

  // CHECK EXISTING INSTITUTE
  const existing = await pool
    .request()
    .input(
      "account_id",
      sql.BigInt,
      accountId
    )
    .query(`
      SELECT *
      FROM institutes
      WHERE account_id=@account_id
    `);

  let institute;

  // ================= INSERT =================
  if (existing.recordset.length === 0) {

    const created = await pool
      .request()
      .input("account_id", sql.BigInt, accountId)
      .input("name", sql.NVarChar(150), name)
      .input("description", sql.NVarChar(1000), description || null)
      .input("email", sql.NVarChar(255), email || null)
      .input("phone_number", sql.NVarChar(20), phone_number)
      .input("address", sql.NVarChar(500), address || null)
      .input("city", sql.NVarChar(100), city)
      .input("state", sql.NVarChar(100), state || null)
      .input("pincode", sql.NVarChar(20), pincode || null)
      .input("distance", sql.NVarChar(50), distance || "")
      .input("rating", sql.Float, rating ?? 0)
      .input("reviews", sql.Int, reviews ?? 0)
      .input("timing", sql.NVarChar(100), timing || "")
      .query(`
        INSERT INTO institutes (
          account_id,
          name,
          description,
          email,
          phone_number,
          address,
          city,
          state,
          pincode,
          distance,
          rating,
          reviews,
          timing,
          approval_status,
          is_active
        )

        OUTPUT INSERTED.*

        VALUES (
          @account_id,
          @name,
          @description,
          @email,
          @phone_number,
          @address,
          @city,
          @state,
          @pincode,
          @distance,
          @rating,
          @reviews,
          @timing,
          'PENDING',
          1
        )
      `);

    institute = created.recordset[0];

  } else {

    // ================= UPDATE =================
    const updated = await pool
      .request()
      .input("account_id", sql.BigInt, accountId)
      .input("name", sql.NVarChar(150), name)
      .input("description", sql.NVarChar(1000), description || null)
      .input("email", sql.NVarChar(255), email || null)
      .input("phone_number", sql.NVarChar(20), phone_number)
      .input("address", sql.NVarChar(500), address || null)
      .input("city", sql.NVarChar(100), city)
      .input("state", sql.NVarChar(100), state || null)
      .input("pincode", sql.NVarChar(20), pincode || null)
      .input("distance", sql.NVarChar(50), distance || "")
      .input("rating", sql.Float, rating ?? 0)
      .input("reviews", sql.Int, reviews ?? 0)
      .input("timing", sql.NVarChar(100), timing || "")
      .query(`
        UPDATE institutes
        SET
          name=@name,
          description=@description,
          email=@email,
          phone_number=@phone_number,
          address=@address,
          city=@city,
          state=@state,
          pincode=@pincode,
          distance=@distance,
          rating=@rating,
          reviews=@reviews,
          timing=@timing,
          updated_at=SYSDATETIME()

        OUTPUT INSERTED.*

        WHERE account_id=@account_id
      `);

    institute = updated.recordset[0];
  }

  // DELETE OLD CATEGORIES
  await pool.request()
    .input("institute_id", sql.BigInt, institute.id)
    .query(`
      DELETE FROM institute_categories
      WHERE institute_id=@institute_id
    `);

  // INSERT NEW CATEGORIES
  for (const cat of (categories || []).slice(0, 5)) {
    await pool.request()
      .input("institute_id", sql.BigInt, institute.id)
      .input(
        "category_id",
        sql.BigInt,
        parseInt(cat.category_id)
      )
      .input(
        "subcategory_id",
        sql.BigInt,
        cat.subcategory_id
          ? parseInt(cat.subcategory_id)
          : null
      )
      .query(`
        INSERT INTO institute_categories (
          institute_id,
          category_id,
          subcategory_id
        )
        VALUES (
          @institute_id,
          @category_id,
          @subcategory_id
        )
      `);
  }

  return institute;
};

/* ─────────────────────────────────────────────
   GET PROFILE
───────────────────────────────────────────── */
export const getInstituteProfileService = async (
  accountId
) => {

  const pool = getPool();

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`
      SELECT
        i.*,

        (
          SELECT COUNT(*)
          FROM trainers
          WHERE institute_id=i.id
        ) AS trainer_count,

        (
          SELECT COUNT(*)
          FROM classes
          WHERE institute_id=i.id
          AND is_active=1
        ) AS class_count

      FROM institutes i
      WHERE i.account_id=@account_id
    `);

  if (!result.recordset.length) {
    throw new Error("Institute not found");
  }

  const institute = result.recordset[0];

  const cats = await pool.request()
    .input("institute_id", sql.BigInt, institute.id)
    .query(`
      SELECT
        ic.*,
        c.name AS category_name,
        s.name AS subcategory_name

      FROM institute_categories ic

      JOIN categories c
      ON ic.category_id=c.id

      LEFT JOIN subcategories s
      ON ic.subcategory_id=s.id

      WHERE ic.institute_id=@institute_id
    `);

  return {
    ...institute,
    categories: cats.recordset,
  };
};

export const getInstituteProfile = async (req, res) => {
  console.log("PROFILE ACCOUNT =", req.account);

  try {
    const result = await getInstituteProfileService(
      req.account?.id
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.log("PROFILE ERROR =", err.message);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ─────────────────────────────────────────────
   LIST INSTITUTES
───────────────────────────────────────────── */
export const listInstitutesService = async ({
  city,
  category_id,
  subcategory_id,
  page = 1,
  limit = 20,
}) => {

  const pool = getPool();

  const offset = (page - 1) * limit;

  let where = `
    WHERE i.approval_status = 'APPROVED'
    AND i.is_active = 1
  `;

  const request = pool.request()
    .input("limit", sql.Int, parseInt(limit))
    .input("offset", sql.Int, offset);

  // CITY FILTER
  if (city) {

    where += ` AND i.city LIKE @city`;

    request.input(
      "city",
      sql.NVarChar(100),
      `%${city}%`
    );
  }

  // CATEGORY FILTER
  if (category_id) {

    where += `
      AND EXISTS (
        SELECT 1
        FROM institute_categories ic
        WHERE ic.institute_id = i.id
        AND ic.category_id = @category_id
      )
    `;

    request.input(
      "category_id",
      sql.BigInt,
      parseInt(category_id)
    );
  }

  // SUBCATEGORY FILTER
  if (subcategory_id) {

    where += `
      AND EXISTS (
        SELECT 1
        FROM institute_categories ic
        WHERE ic.institute_id = i.id
        AND ic.subcategory_id = @subcategory_id
      )
    `;

    request.input(
      "subcategory_id",
      sql.BigInt,
      parseInt(subcategory_id)
    );
  }

  const result = await request.query(`
  SELECT
  i.id,
  i.name,
  i.description,
  i.image_url,
  i.phone_number,
  i.city,
  i.state,
  i.rating,
  i.reviews,
  i.distance,
  i.timing,
  i.approval_status
FROM institutes i

    ${where}

    ORDER BY i.created_at DESC

    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  const institutes = result.recordset;

  // ENRICH DATA
  for (const institute of institutes) {

    // LOCATION
    institute.location =
      `${institute.city || ""}, ${institute.state || ""}`
        .replace(/^,\s*|,\s*$/g, "");

    // IMAGE
    institute.image_url =
      institute.image_url ||
     
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1200";

    // PHONE
    institute.phone =
      institute.phone_number || "";

    // COURSES
    const courseResult = await pool.request()
      .input("institute_id", sql.BigInt, institute.id)
      .query(`
        SELECT s.name AS subcategory_name

        FROM institute_categories ic

        LEFT JOIN subcategories s
        ON ic.subcategory_id = s.id

        WHERE ic.institute_id = @institute_id
      `);

    institute.courses = courseResult.recordset
      .map(c => c.subcategory_name)
      .filter(Boolean);

    // CATEGORY STRUCTURE
    const categoryResult = await pool.request()
      .input("institute_id", sql.BigInt, institute.id)
      .query(`
        SELECT
          ic.category_id,
          c.name AS category_name,
          ic.subcategory_id,
          s.name AS subcategory_name

        FROM institute_categories ic

        LEFT JOIN categories c
        ON c.id = ic.category_id

        LEFT JOIN subcategories s
        ON s.id = ic.subcategory_id

        WHERE ic.institute_id = @institute_id
      `);

    institute.categories =
      categoryResult.recordset.map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        subcategory_id: c.subcategory_id,
        subcategory_name: c.subcategory_name,
      }));

    // SAFE DEFAULTS
    institute.rating = institute.rating ?? 0;
    institute.reviews = institute.reviews ?? 0;
    institute.distance = institute.distance ?? "";
    institute.timing = institute.timing ?? "";
    institute.description = institute.description ?? "";

   
  }

  return institutes;
};

/* ─────────────────────────────────────────────
   TRAINERS
───────────────────────────────────────────── */
export const getInstituteTrainersService = async (
  instituteId
) => {

  const pool = getPool();

  const result = await pool.request()
    .input(
      "institute_id",
      sql.BigInt,
      parseInt(instituteId)
    )
    .query(`
      SELECT
        t.*,

        (
          SELECT COUNT(*)
          FROM classes
          WHERE trainer_id=t.id
          AND is_active=1
        ) AS class_count

      FROM trainers t

      WHERE t.institute_id=@institute_id
      AND t.is_active=1
    `);

  return result.recordset;
};

/* ─────────────────────────────────────────────
   TRAINER APPROVAL
───────────────────────────────────────────── */
export const updateTrainerApprovalService = async (
  instituteAccountId,
  trainerId,
  status,
  reason
) => {

  const pool = getPool();

  const instResult = await pool.request()
    .input(
      "account_id",
      sql.BigInt,
      instituteAccountId
    )
    .query(`
      SELECT id
      FROM institutes
      WHERE account_id=@account_id
    `);

  if (!instResult.recordset.length) {
    throw new Error("Institute not found");
  }

  const instituteId =
    instResult.recordset[0].id;

  const trainerCheck = await pool.request()
    .input(
      "trainer_id",
      sql.BigInt,
      parseInt(trainerId)
    )
    .input(
      "institute_id",
      sql.BigInt,
      instituteId
    )
    .query(`
      SELECT id
      FROM trainers
      WHERE id=@trainer_id
      AND institute_id=@institute_id
    `);

  if (!trainerCheck.recordset.length) {
    throw new Error(
      "Trainer not found in your institute"
    );
  }

  await pool.request()
    .input(
      "trainer_id",
      sql.BigInt,
      parseInt(trainerId)
    )
    .input(
      "status",
      sql.NVarChar(20),
      status
    )
    .input(
      "reason",
      sql.NVarChar(500),
      reason || null
    )
    .query(`
      UPDATE trainers

      SET
        approval_status=@status,
        rejection_reason=@reason,
        updated_at=SYSDATETIME()

      WHERE id=@trainer_id
    `);

  return {
    trainer_id: trainerId,
    approval_status: status,
  };
};



/* ─────────────────────────────────────────────
   ADMIN - UPDATE INSTITUTE
───────────────────────────────────────────── */
export const updateInstituteService = async (
  instituteId,
  body
) => {
  const pool = getPool();

  const {
    name,
    description,
    email,
    phone_number,
    address,
    city,
    state,
    pincode,
    image_url,
    timing,
  } = body;

  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(instituteId))
    .input("name", sql.NVarChar(150), name)
    .input("description", sql.NVarChar(1000), description)
    .input("email", sql.NVarChar(255), email)
    .input("phone_number", sql.NVarChar(20), phone_number)
    .input("address", sql.NVarChar(500), address)
    .input("city", sql.NVarChar(100), city)
    .input("state", sql.NVarChar(100), state)
    .input("pincode", sql.NVarChar(20), pincode)
    .input("image_url", sql.NVarChar(500), image_url || null)
    .input("timing", sql.NVarChar(100), timing)

    .query(`
      UPDATE institutes
      SET
        name=@name,
        description=@description,
        email=@email,
        phone_number=@phone_number,
        address=@address,
        city=@city,
        state=@state,
        pincode=@pincode,
        image_url = COALESCE(@image_url, image_url),
        timing=@timing,
        updated_at=SYSDATETIME()

      OUTPUT INSERTED.*

      WHERE id=@id
    `);

  if (!result.recordset.length) {
    throw new Error("Institute not found");
  }

  return result.recordset[0];
};

/* ─────────────────────────────────────────────
   ADMIN - DELETE INSTITUTE
───────────────────────────────────────────── */
export const deleteInstituteService = async (
  instituteId
) => {
  const pool = getPool();

  await pool.request()
    .input("id", sql.BigInt, parseInt(instituteId))
    .query(`
      DELETE FROM institute_categories
      WHERE institute_id=@id
    `);

  await pool.request()
    .input("id", sql.BigInt, parseInt(instituteId))
    .query(`
      DELETE FROM institutes
      WHERE id=@id
    `);

  return true;
};

/* ─────────────────────────────────────────────
   ADMIN - APPROVE / REJECT INSTITUTE
───────────────────────────────────────────── */
export const updateInstituteApprovalService = async (
  instituteId,
  approvalStatus
) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(instituteId))
    .input(
      "approval_status",
      sql.NVarChar(20),
      approvalStatus
    )
    .query(`
      UPDATE institutes
      SET
        approval_status=@approval_status,
        updated_at=SYSDATETIME()

      OUTPUT INSERTED.*

      WHERE id=@id
    `);

  if (!result.recordset.length) {
    throw new Error("Institute not found");
  }

  return result.recordset[0];
};


/* =========================
   PENDING INSTITUTES
========================= */
export const getPendingInstitutesService =
  async () => {
    const pool = getPool();

    const result = await pool.request()
      .query(`
        SELECT *
        FROM institutes
        WHERE approval_status = 'PENDING'
        ORDER BY created_at DESC
      `);

    return result.recordset;
  };

/* =========================
   APPROVED INSTITUTES
========================= */
export const getApprovedInstitutesService =
  async () => {
    const pool = getPool();

    const result = await pool.request()
      .query(`
        SELECT *
        FROM institutes
        WHERE approval_status = 'APPROVED'
        ORDER BY created_at DESC
      `);

    return result.recordset;
  };


  export const getInstituteDashboardService =
  async (accountId) => {

    const pool = getPool();

    const instituteResult =
      await pool.request()
        .input(
          "account_id",
          sql.BigInt,
          accountId
        )
        .query(`
          SELECT *
          FROM institutes
          WHERE account_id=@account_id
        `);

    if (!instituteResult.recordset.length) {
      throw new Error(
        "Institute not found"
      );
    }

    const institute =
      instituteResult.recordset[0];

    const trainerCount =
      await pool.request()
        .input(
          "institute_id",
          sql.BigInt,
          institute.id
        )
        .query(`
          SELECT COUNT(*) AS total
          FROM trainers
          WHERE institute_id=@institute_id
        `);

    const classCount =
      await pool.request()
        .input(
          "institute_id",
          sql.BigInt,
          institute.id
        )
        .query(`
          SELECT COUNT(*) AS total
          FROM classes
          WHERE institute_id=@institute_id
        `);

    return {
      institute,
      total_trainers:
        trainerCount.recordset[0].total,
      total_classes:
        classCount.recordset[0].total,
    };
  };


  export const getInstituteStudentsService =
  async (accountId) => {

    const pool = getPool();

    const institute =
      await pool.request()
        .input(
          "account_id",
          sql.BigInt,
          accountId
        )
        .query(`
          SELECT id
          FROM institutes
          WHERE account_id=@account_id
        `);

    if (!institute.recordset.length) {
      throw new Error(
        "Institute not found"
      );
    }

    const instituteId =
      institute.recordset[0].id;

    const result =
      await pool.request()
        .input(
          "institute_id",
          sql.BigInt,
          instituteId
        )
        .query(`
          SELECT *
          FROM students
          WHERE institute_id=@institute_id
        `);

    return result.recordset;
  };

  export const getInstituteBookingsService =
  async (accountId) => {

    const pool = getPool();

    const institute =
      await pool.request()
        .input(
          "account_id",
          sql.BigInt,
          accountId
        )
        .query(`
          SELECT id
          FROM institutes
          WHERE account_id=@account_id
        `);

    if (!institute.recordset.length) {
      throw new Error(
        "Institute not found"
      );
    }

    const instituteId =
      institute.recordset[0].id;

    const result =
      await pool.request()
        .input(
          "institute_id",
          sql.BigInt,
          instituteId
        )
        .query(`
          SELECT *
          FROM bookings
          WHERE institute_id=@institute_id
          ORDER BY created_at DESC
        `);

    return result.recordset;
  };


  export const getAllInstitutesAdminService =
  async () => {
    const pool = getPool();

    const result = await pool.request()
      .query(`
        SELECT *
        FROM institutes
        ORDER BY created_at DESC
      `);

    return result.recordset;
  };

  export const getRejectedInstitutesService =
  async () => {
    const pool = getPool();

    const result = await pool.request()
      .query(`
        SELECT *
        FROM institutes
        WHERE approval_status = 'REJECTED'
        ORDER BY created_at DESC
      `);

    return result.recordset;
  };

  export const createInstituteByAdminService =
  async (accountId, body = {}) => {

    const pool = getPool();

    const result = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .input("name", sql.NVarChar(150), body.name)
      .query(`
        INSERT INTO institutes (
          account_id,
          name,
          approval_status,
          is_active
        )

        OUTPUT INSERTED.*

        VALUES (
          @account_id,
          @name,
          'APPROVED',
          1
        )
      `);

    return result.recordset[0];
  };

 