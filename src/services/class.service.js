import { getPool, sql } from "../config/db.js";

/* ── HELPERS ────────────────────────────────────────────────────────────── */
const VALID_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_MODES  = ["ONLINE", "OFFLINE", "HYBRID"];

// ✅ Trims all keys — fixes " price" typo from Insomnia/Postman
const trimBody = (raw) =>
  Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim(), v]));

const validateClassBody = (body) => {
  const { title, category_id, level, mode, price, duration } = body;
  if (!title?.trim())   throw new Error("title is required");
  if (!category_id)     throw new Error("category_id is required");
  if (level && !VALID_LEVELS.includes(level))
    throw new Error(`level must be one of: ${VALID_LEVELS.join(", ")}`);
  if (mode && !VALID_MODES.includes(mode))
    throw new Error(`mode must be one of: ${VALID_MODES.join(", ")}`);
  if (price !== undefined && parseFloat(price) < 0)
    throw new Error("price cannot be negative");
  if (duration !== undefined && parseInt(duration) <= 0)
    throw new Error("duration must be positive");
};

/* ── CREATE CLASS — by TRAINER ──────────────────────────────────────────── */
export const createClassByTrainerService = async (accountId, rawBody) => {
  const pool = getPool();

  // ✅ Trim all keys to fix " price" typo
  const body = trimBody(rawBody);
  validateClassBody(body);

  const {
    title, description, category_id, subcategory_id,
    duration, level, mode, max_students,
    meeting_link, schedule, image, highlights,
  } = body;

  // ✅ Safe price parse — handles string, number, undefined, typo
  const price = body.price !== undefined && body.price !== null && body.price !== ""
    ? parseFloat(body.price)
    : 0;

  // 1. Verify trainer is APPROVED
  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, approval_status, institute_id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0)
    throw new Error("Trainer profile not found. Please complete your profile first.");

  const trainer = trainerResult.recordset[0];

  if (trainer.approval_status !== "APPROVED")
    throw new Error("Your profile is not approved yet. Please wait for admin approval.");

  // 2. Verify category is in trainer specializations
  const specCheck = await pool.request()
    .input("trainer_id",  sql.BigInt, trainer.id)
    .input("category_id", sql.BigInt, parseInt(category_id))
    .query(`SELECT id FROM trainer_specializations WHERE trainer_id = @trainer_id AND category_id = @category_id`);

  if (specCheck.recordset.length === 0)
    throw new Error("This category is not in your specializations. Please update your profile first.");

  // 3. Status based on whether trainer is under institute or independent
  const classStatus = trainer.institute_id ? "ACTIVE" : "DRAFT";

  const classResult = await pool.request()
    .input("title",          sql.NVarChar(150),  title.trim())
    .input("description",    sql.NVarChar(1000), description   || null)
    .input("institute_id",   sql.BigInt,         trainer.institute_id || null)
    .input("trainer_id",     sql.BigInt,         trainer.id)
    .input("category_id",    sql.BigInt,         parseInt(category_id))
    .input("subcategory_id", sql.BigInt,         subcategory_id ? parseInt(subcategory_id) : null)
    .input("price",          sql.Decimal(10,2),  price)           // ✅ never undefined
    .input("duration",       sql.Int,            parseInt(duration) || 60)
    .input("level",          sql.NVarChar(20),   level         || "BEGINNER")
    .input("mode",           sql.NVarChar(20),   mode          || "ONLINE")
    .input("max_students",   sql.Int,            max_students  ? parseInt(max_students) : null)
    .input("meeting_link",   sql.NVarChar(500),  meeting_link  || null)
    .input("image",          sql.NVarChar(500),  image         || null)
    .input("highlights",     sql.NVarChar(1000), highlights    || null)
    .input("status",         sql.NVarChar(20),   classStatus)
    .query(`
      INSERT INTO classes
        (title, description, institute_id, trainer_id, category_id, subcategory_id,
         price, duration, level, mode, max_students, meeting_link, image, highlights,
         status, is_active)
      OUTPUT INSERTED.*
      VALUES
        (@title, @description, @institute_id, @trainer_id, @category_id, @subcategory_id,
         @price, @duration, @level, @mode, @max_students, @meeting_link, @image, @highlights,
         @status, 1)
    `);

  const newClass = classResult.recordset[0];

  if (schedule) await insertSchedule(pool, newClass.id, schedule);

  return {
    ...newClass,
    note: classStatus === "DRAFT"
      ? "Your class is submitted for admin approval. It will go live once approved."
      : "Class is live.",
  };
};

/* ── CREATE CLASS — by INSTITUTE ────────────────────────────────────────── */
export const createClassByInstituteService = async (accountId, rawBody) => {
  const pool = getPool();

  // ✅ Trim all keys to fix " price" typo
  const body = trimBody(rawBody);
  validateClassBody(body);

  const {
    title, description, trainer_id, category_id, subcategory_id,
    duration, level, mode, max_students, meeting_link, schedule,
    image, highlights,
  } = body;

  // ✅ Safe price parse
  const price = body.price !== undefined && body.price !== null && body.price !== ""
    ? parseFloat(body.price)
    : 0;

  // 1. Verify institute is APPROVED
  const instResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, approval_status FROM institutes WHERE account_id = @account_id`);

  if (instResult.recordset.length === 0) throw new Error("Institute not found");
  const institute = instResult.recordset[0];
  if (institute.approval_status !== "APPROVED")
    throw new Error("Your institute is not approved yet.");

  if (!trainer_id) throw new Error("trainer_id is required");

  // 2. Verify trainer
  const trainerCheck = await pool.request()
    .input("trainer_id", sql.BigInt, parseInt(trainer_id))
    .query(`SELECT id, approval_status, institute_id FROM trainers WHERE id = @trainer_id`);

  if (trainerCheck.recordset.length === 0) throw new Error("Trainer not found");
  const trainer = trainerCheck.recordset[0];
  if (trainer.approval_status !== "APPROVED")
    throw new Error("This trainer is not yet approved by admin");

  // Auto-link trainer to institute if not already linked
  if (!trainer.institute_id || trainer.institute_id !== institute.id) {
    await pool.request()
      .input("trainer_id",   sql.BigInt, parseInt(trainer_id))
      .input("institute_id", sql.BigInt, institute.id)
      .query(`UPDATE trainers SET institute_id = @institute_id, updated_at = SYSDATETIME() WHERE id = @trainer_id`);
  }

  // 3. Insert class
  const classResult = await pool.request()
    .input("title",          sql.NVarChar(150),  title.trim())
    .input("description",    sql.NVarChar(1000), description   || null)
    .input("institute_id",   sql.BigInt,         institute.id)
    .input("trainer_id",     sql.BigInt,         parseInt(trainer_id))
    .input("category_id",    sql.BigInt,         parseInt(category_id))
    .input("subcategory_id", sql.BigInt,         subcategory_id ? parseInt(subcategory_id) : null)
    .input("price",          sql.Decimal(10,2),  price)           // ✅ fixed
    .input("duration",       sql.Int,            parseInt(duration) || 60)
    .input("level",          sql.NVarChar(20),   level         || "BEGINNER")
    .input("mode",           sql.NVarChar(20),   mode          || "ONLINE")
    .input("max_students",   sql.Int,            max_students  ? parseInt(max_students) : null)
    .input("meeting_link",   sql.NVarChar(500),  meeting_link  || null)
    .input("image",          sql.NVarChar(500),  image         || null)
    .input("highlights",     sql.NVarChar(1000), highlights    || null)
    .query(`
      INSERT INTO classes
        (title, description, institute_id, trainer_id, category_id, subcategory_id,
         price, duration, level, mode, max_students, meeting_link, image, highlights,
         status, is_active)
      OUTPUT INSERTED.*
      VALUES
        (@title, @description, @institute_id, @trainer_id, @category_id, @subcategory_id,
         @price, @duration, @level, @mode, @max_students, @meeting_link, @image, @highlights,
         'ACTIVE', 1)
    `);

  const newClass = classResult.recordset[0];
  if (schedule) await insertSchedule(pool, newClass.id, schedule);
  return newClass;
};

/* ── LIST CLASSES — public with filters ─────────────────────────────────── */
export const listClassesService = async (query) => {
  const pool = getPool();

  const {
    category_id, subcategory_id, institute_id, trainer_id,
    level, mode, min_price, max_price, city, search,
    page = 1, limit = 12,
  } = query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const request = pool.request()
    .input("limit",  sql.Int, parseInt(limit))
    .input("offset", sql.Int, offset);

  let where = `WHERE c.status = 'ACTIVE' AND c.is_active = 1`;

  if (category_id) {
    where += ` AND c.category_id = @category_id`;
    request.input("category_id", sql.BigInt, parseInt(category_id));
  }
  if (subcategory_id) {
    where += ` AND c.subcategory_id = @subcategory_id`;
    request.input("subcategory_id", sql.BigInt, parseInt(subcategory_id));
  }
  if (institute_id) {
    where += ` AND c.institute_id = @institute_id`;
    request.input("institute_id", sql.BigInt, parseInt(institute_id));
  }
  if (trainer_id) {
    where += ` AND c.trainer_id = @trainer_id`;
    request.input("trainer_id", sql.BigInt, parseInt(trainer_id));
  }
  if (level) {
    where += ` AND c.level = @level`;
    request.input("level", sql.NVarChar(20), level);
  }
  if (mode) {
    where += ` AND c.mode = @mode`;
    request.input("mode", sql.NVarChar(20), mode);
  }
  if (min_price) {
    where += ` AND c.price >= @min_price`;
    request.input("min_price", sql.Decimal(10,2), parseFloat(min_price));
  }
  if (max_price) {
    where += ` AND c.price <= @max_price`;
    request.input("max_price", sql.Decimal(10,2), parseFloat(max_price));
  }
  if (city) {
    where += ` AND i.city LIKE @city`;
    request.input("city", sql.NVarChar(100), `%${city}%`);
  }
  if (search) {
    where += `
      AND (
        c.title       LIKE @search OR c.description LIKE @search
        OR t.full_name LIKE @search OR cat.name     LIKE @search
        OR sub.name   LIKE @search OR i.name        LIKE @search
      )`;
    request.input("search", sql.NVarChar(200), `%${search}%`);
  }

  const result = await request.query(`
    SELECT
      c.id, c.title, c.description,
      c.price,          -- ✅ real price from DB
      c.duration, c.level, c.mode, c.max_students,
      c.image, c.highlights, c.status, c.created_at,
      cat.name AS category_name,
      sub.name AS subcategory_name,
      t.id   AS trainer_id,
      t.full_name AS trainer_name,
      t.profile_image AS trainer_image,
      i.id   AS institute_id,
      i.name AS institute_name,
      i.logo AS institute_logo,
      i.banner_image,
      i.city, i.state, i.rating,
      sch.days_of_week, sch.start_time, sch.end_time
    FROM classes c
    LEFT JOIN categories    cat ON c.category_id    = cat.id
    LEFT JOIN subcategories sub ON c.subcategory_id = sub.id
    LEFT JOIN trainers      t   ON c.trainer_id     = t.id
    LEFT JOIN institutes    i   ON c.institute_id   = i.id
    LEFT JOIN class_schedules sch ON sch.class_id   = c.id
    ${where}
    ORDER BY c.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset.map((c) => ({
    id:            c.id,
    title:         c.title,
    description:   c.description,
    category:      c.category_name,
    subcategory:   c.subcategory_name,
    trainerId:     c.trainer_id,
    trainer:       c.trainer_name,
    trainerImage:  c.trainer_image,
    rating:        Number(c.rating  || 0),
    price:         Number(c.price   || 0),   // ✅ real price
    image:         c.image || c.banner_image || c.institute_logo,
    duration:      `${c.duration} min`,
    level:         c.level ? c.level.charAt(0) + c.level.slice(1).toLowerCase() : "",
    students:      c.max_students || 0,
    highlights:    c.highlights ? c.highlights.split(",") : [],
    schedule:      c.days_of_week ? [`${c.days_of_week} ${c.start_time}`] : [],
    instituteId:   c.institute_id,
    instituteName: c.institute_name,
    location:      c.city ? `${c.city}, ${c.state}` : "",
    mode:          c.mode,
    createdAt:     c.created_at,
  }));
};

/* ── GET SINGLE CLASS ───────────────────────────────────────────────────── */
export const getClassByIdService = async (id) => {
  const pool = getPool();

  const result = await pool.request()
    .input("id", sql.BigInt, parseInt(id))
    .query(`
      SELECT
        c.id, c.title, c.description,
        c.price,        -- ✅ real price
        c.trial_price, c.duration, c.level, c.mode,
        c.max_students, c.image, c.highlights, c.created_at,
        cat.name AS category_name,
        sub.name AS subcategory_name,
        t.id   AS trainer_id,
        t.full_name AS trainer_name,
        t.bio  AS trainer_bio,
        t.profile_image AS trainer_image,
        t.experience_years,
        i.id   AS institute_id,
        i.name AS institute_name,
        i.logo AS institute_logo,
        i.banner_image, i.city, i.state,
        sch.days_of_week, sch.start_time, sch.end_time
      FROM classes c
      LEFT JOIN categories    cat ON c.category_id    = cat.id
      LEFT JOIN subcategories sub ON c.subcategory_id = sub.id
      LEFT JOIN trainers      t   ON c.trainer_id     = t.id
      LEFT JOIN institutes    i   ON c.institute_id   = i.id
      LEFT JOIN class_schedules sch ON sch.class_id   = c.id
      WHERE c.id = @id
    `);

  if (!result.recordset.length) throw new Error("Class not found");

  const c = result.recordset[0];

  return {
    id:              c.id,
    title:           c.title,
    description:     c.description,
    category:        c.category_name,
    subcategory:     c.subcategory_name,
    image:           c.image || c.banner_image || c.institute_logo,
    price:           Number(c.price       || 0),   // ✅ real price
    trialPrice:      Number(c.trial_price || 0),
    duration:        c.duration,
    level:           c.level,
    mode:            c.mode,
    students:        c.max_students || 0,
    highlights:      c.highlights ? c.highlights.split(",").map((h) => h.trim()) : [],
    schedule:        c.days_of_week
      ? c.days_of_week.split(",").map((day) => {
          const t = c.start_time ? c.start_time.toString().substring(0, 5) : "00:00";
          let [h] = t.split(":");
          h = parseInt(h);
          return `${day.trim()} ${h % 12 || 12}${h >= 12 ? "PM" : "AM"}`;
        })
      : [],
    trainerId:       c.trainer_id,
    trainer:         c.trainer_name,
    trainerBio:      c.trainer_bio,
    trainerImage:    c.trainer_image,
    experienceYears: c.experience_years,
    instituteId:     c.institute_id,
    instituteName:   c.institute_name,
    instituteLogo:   c.institute_logo,
    instituteCity:   c.city,
    instituteState:  c.state,
    createdAt:       c.created_at,
  };
};

/* ── UPDATE CLASS ───────────────────────────────────────────────────────── */
export const updateClassService = async (accountId, classId, role, rawBody) => {
  const pool = getPool();
  const body  = trimBody(rawBody);  // ✅ trim keys

  let ownerCheck;
  if (role === "INSTITUTE") {
    const inst = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`SELECT id FROM institutes WHERE account_id = @account_id`);
    if (inst.recordset.length === 0) throw new Error("Institute not found");
    ownerCheck = await pool.request()
      .input("class_id",     sql.BigInt, parseInt(classId))
      .input("institute_id", sql.BigInt, inst.recordset[0].id)
      .query(`SELECT id FROM classes WHERE id = @class_id AND institute_id = @institute_id`);
  } else {
    const trainer = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);
    if (trainer.recordset.length === 0) throw new Error("Trainer not found");
    ownerCheck = await pool.request()
      .input("class_id",  sql.BigInt, parseInt(classId))
      .input("trainer_id",sql.BigInt, trainer.recordset[0].id)
      .query(`SELECT id FROM classes WHERE id = @class_id AND trainer_id = @trainer_id`);
  }

  if (ownerCheck.recordset.length === 0) throw new Error("Class not found or access denied");

  const { title, description, duration, level, mode, max_students, meeting_link } = body;
  const price = body.price !== undefined ? parseFloat(body.price) : 0;  // ✅ safe

  const result = await pool.request()
    .input("id",           sql.BigInt,        parseInt(classId))
    .input("title",        sql.NVarChar(150),  title)
    .input("description",  sql.NVarChar(1000), description  || null)
    .input("price",        sql.Decimal(10,2),  price)
    .input("duration",     sql.Int,            parseInt(duration) || 60)
    .input("level",        sql.NVarChar(20),   level        || "BEGINNER")
    .input("mode",         sql.NVarChar(20),   mode         || "ONLINE")
    .input("max_students", sql.Int,            max_students ? parseInt(max_students) : null)
    .input("meeting_link", sql.NVarChar(500),  meeting_link || null)
    .query(`
      UPDATE classes SET
        title = @title, description = @description, price = @price,
        duration = @duration, level = @level, mode = @mode,
        max_students = @max_students, meeting_link = @meeting_link,
        updated_at = SYSDATETIME()
      OUTPUT INSERTED.*
      WHERE id = @id
    `);

  return result.recordset[0];
};

/* ── DELETE CLASS (soft) ────────────────────────────────────────────────── */
export const deleteClassService = async (accountId, classId, role) => {
  const pool = getPool();

  if (role === "INSTITUTE") {
    const inst = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`SELECT id FROM institutes WHERE account_id = @account_id`);
    if (inst.recordset.length === 0) throw new Error("Institute not found");
    await pool.request()
      .input("id",          sql.BigInt, parseInt(classId))
      .input("institute_id",sql.BigInt, inst.recordset[0].id)
      .query(`UPDATE classes SET is_active=0, status='CANCELLED', updated_at=SYSDATETIME() WHERE id=@id AND institute_id=@institute_id`);
  } else {
    const trainer = await pool.request()
      .input("account_id", sql.BigInt, accountId)
      .query(`SELECT id FROM trainers WHERE account_id = @account_id`);
    if (trainer.recordset.length === 0) throw new Error("Trainer not found");
    await pool.request()
      .input("id",        sql.BigInt, parseInt(classId))
      .input("trainer_id",sql.BigInt, trainer.recordset[0].id)
      .query(`UPDATE classes SET is_active=0, status='CANCELLED', updated_at=SYSDATETIME() WHERE id=@id AND trainer_id=@trainer_id`);
  }

  return { class_id: classId, deleted: true };
};

/* ── TRAINER → APPLY TO INSTITUTE ──────────────────────────────────────── */
export const trainerApplyToInstituteService = async (accountId, instituteId) => {
  const pool = getPool();

  const trainerResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, approval_status, institute_id FROM trainers WHERE account_id = @account_id`);

  if (trainerResult.recordset.length === 0) throw new Error("Trainer profile not found");
  const trainer = trainerResult.recordset[0];
  if (trainer.approval_status !== "APPROVED")
    throw new Error("Your profile must be approved before applying");
  if (trainer.institute_id) throw new Error("You are already associated with an institute");

  const instResult = await pool.request()
    .input("id", sql.BigInt, parseInt(instituteId))
    .query(`SELECT id, approval_status FROM institutes WHERE id = @id`);

  if (instResult.recordset.length === 0) throw new Error("Institute not found");
  if (instResult.recordset[0].approval_status !== "APPROVED")
    throw new Error("This institute is not approved");

  await pool.request()
    .input("trainer_id",   sql.BigInt, trainer.id)
    .input("institute_id", sql.BigInt, parseInt(instituteId))
    .query(`UPDATE trainers SET institute_id=@institute_id, approval_status='PENDING', updated_at=SYSDATETIME() WHERE id=@trainer_id`);

  return { trainer_id: trainer.id, institute_id: parseInt(instituteId), status: "PENDING" };
};

/* ── INSTITUTE → RESPOND TO TRAINER ────────────────────────────────────── */
export const instituteRespondToTrainerService = async (accountId, trainerId, action) => {
  const pool = getPool();

  const instResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM institutes WHERE account_id = @account_id`);
  if (instResult.recordset.length === 0) throw new Error("Institute not found");
  const instituteId = instResult.recordset[0].id;

  const trainerCheck = await pool.request()
    .input("trainer_id",   sql.BigInt, parseInt(trainerId))
    .input("institute_id", sql.BigInt, instituteId)
    .query(`SELECT id FROM trainers WHERE id=@trainer_id AND institute_id=@institute_id`);
  if (trainerCheck.recordset.length === 0)
    throw new Error("Trainer application not found for your institute");

  if (action === "reject") {
    await pool.request()
      .input("trainer_id", sql.BigInt, parseInt(trainerId))
      .query(`UPDATE trainers SET institute_id=NULL, approval_status='APPROVED', updated_at=SYSDATETIME() WHERE id=@trainer_id`);
  } else {
    await pool.request()
      .input("trainer_id", sql.BigInt, parseInt(trainerId))
      .query(`UPDATE trainers SET approval_status='APPROVED', updated_at=SYSDATETIME() WHERE id=@trainer_id`);
  }

  return { trainer_id: parseInt(trainerId), status: action === "accept" ? "APPROVED" : "REJECTED" };
};

/* ── INSTITUTE → ADD TRAINER ────────────────────────────────────────────── */
export const instituteAddTrainerService = async (accountId, body) => {
  const pool = getPool();
  const { full_name, email, phone_number, bio, experience_years, category_id, subcategory_id } = body;

  if (!full_name || !phone_number) throw new Error("full_name and phone_number are required");

  const instResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id, approval_status FROM institutes WHERE account_id = @account_id`);
  if (instResult.recordset.length === 0) throw new Error("Institute not found");
  const institute = instResult.recordset[0];
  if (institute.approval_status !== "APPROVED") throw new Error("Your institute is not approved yet");

  let trainerAccount;
  const existingAccount = await pool.request()
    .input("phone_number", sql.NVarChar(20), phone_number)
    .query(`SELECT * FROM accounts WHERE phone_number = @phone_number`);

  if (existingAccount.recordset.length > 0) {
    trainerAccount = existingAccount.recordset[0];
  } else {
    const inserted = await pool.request()
      .input("phone_number", sql.NVarChar(20),  phone_number)
      .input("email",        sql.NVarChar(255), email || null)
      .query(`INSERT INTO accounts (phone_number, email, role, is_active, is_verified) OUTPUT INSERTED.* VALUES (@phone_number, @email, 'TRAINER', 1, 1)`);
    trainerAccount = inserted.recordset[0];
  }

  const existingTrainer = await pool.request()
    .input("account_id", sql.BigInt, trainerAccount.id)
    .query(`SELECT * FROM trainers WHERE account_id = @account_id`);

  if (existingTrainer.recordset.length > 0) {
    await pool.request()
      .input("trainer_id",   sql.BigInt, existingTrainer.recordset[0].id)
      .input("institute_id", sql.BigInt, institute.id)
      .query(`UPDATE trainers SET institute_id=@institute_id, approval_status='APPROVED', updated_at=SYSDATETIME() WHERE id=@trainer_id`);
    return { ...existingTrainer.recordset[0], institute_id: institute.id };
  }

  const trainerResult = await pool.request()
    .input("account_id",       sql.BigInt,        trainerAccount.id)
    .input("institute_id",     sql.BigInt,        institute.id)
    .input("full_name",        sql.NVarChar(150),  full_name)
    .input("bio",              sql.NVarChar(1000), bio || null)
    .input("experience_years", sql.Int,            parseInt(experience_years) || 0)
    .input("email",            sql.NVarChar(255),  email || null)
    .input("phone_number",     sql.NVarChar(20),   phone_number)
    .query(`
      INSERT INTO trainers (account_id, institute_id, full_name, bio, experience_years, email, phone_number, approval_status, is_profile_completed, is_active)
      OUTPUT INSERTED.*
      VALUES (@account_id, @institute_id, @full_name, @bio, @experience_years, @email, @phone_number, 'APPROVED', 1, 1)
    `);

  const newTrainer = trainerResult.recordset[0];

  if (category_id) {
    await pool.request()
      .input("trainer_id",     sql.BigInt, newTrainer.id)
      .input("category_id",    sql.BigInt, parseInt(category_id))
      .input("subcategory_id", sql.BigInt, subcategory_id ? parseInt(subcategory_id) : null)
      .query(`INSERT INTO trainer_specializations (trainer_id, category_id, subcategory_id) VALUES (@trainer_id, @category_id, @subcategory_id)`);
  }

  return newTrainer;
};

/* ── GET INSTITUTE TRAINER APPLICATIONS ─────────────────────────────────── */
export const getInstituteTrainerApplicationsService = async (accountId) => {
  const pool = getPool();

  const instResult = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .query(`SELECT id FROM institutes WHERE account_id = @account_id`);
  if (instResult.recordset.length === 0) throw new Error("Institute not found");

  const result = await pool.request()
    .input("institute_id", sql.BigInt, instResult.recordset[0].id)
    .query(`
      SELECT t.id, t.full_name, t.bio, t.experience_years,
        t.profile_image, t.approval_status, t.phone_number, t.email,
        a.phone_number AS account_phone,
        (SELECT STRING_AGG(c.name, ', ') FROM trainer_specializations ts
         JOIN categories c ON ts.category_id = c.id WHERE ts.trainer_id = t.id) AS specializations
      FROM trainers t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.institute_id = @institute_id AND t.approval_status = 'PENDING'
    `);

  return result.recordset;
};

/* ── HELPER: Insert schedule ────────────────────────────────────────────── */
const insertSchedule = async (pool, classId, schedule) => {
  const { start_date, end_date, start_time, end_time, days_of_week } = schedule;
  if (!start_date || !end_date || !start_time || !end_time) return;

  await pool.request()
    .input("class_id",     sql.BigInt,        classId)
    .input("start_date",   sql.Date,          new Date(start_date))
    .input("end_date",     sql.Date,          new Date(end_date))
    .input("start_time",   sql.NVarChar(10),  start_time)
    .input("end_time",     sql.NVarChar(10),  end_time)
    .input("days_of_week", sql.NVarChar(100), days_of_week || null)
    .query(`INSERT INTO class_schedules (class_id, start_date, end_date, start_time, end_time, days_of_week) VALUES (@class_id, @start_date, @end_date, @start_time, @end_time, @days_of_week)`);
};

/* ── getClassesService (legacy — kept for compatibility) ────────────────── */
export const getClassesService = async (params) => {
