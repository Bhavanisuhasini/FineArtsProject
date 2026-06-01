// import { getPool, sql } from "../config/db.js";

// /* ── LOGIN / AUTO-CREATE ────────────────────────────────────────────────── */
// export const instituteLoginService = async (firebaseUser) => {
//   const pool = getPool();
//   const { uid, phone_number, email } = firebaseUser;

//   // Upsert account
//   let accountResult = await pool.request()
//     .input("firebase_uid", sql.NVarChar(255), uid)
//     .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);

//   let account;
//   if (accountResult.recordset.length === 0) {
//     await pool.request()
//       .input("firebase_uid", sql.NVarChar(255), uid)

//       .input("phone_number", sql.NVarChar(20), phone_number || null)
//       .input("email", sql.NVarChar(255), email || null)
//       .query(`
//         MERGE accounts AS target
//         USING (SELECT @firebase_uid AS firebase_uid) AS source
//           ON target.firebase_uid = source.firebase_uid
//         WHEN NOT MATCHED THEN
//           INSERT (firebase_uid, phone_number, email, role, is_active, is_verified)
//           VALUES (@firebase_uid, @phone_number, @email, 'INSTITUTE', 1, 1);
//       `);

//     const inserted = await pool.request()
//       .input("firebase_uid", sql.NVarChar(255), uid)
//       .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);
//     account = inserted.recordset[0];
//   } else {
//     account = accountResult.recordset[0];
//   }

//   // Upsert institute row
//   let instituteResult = await pool.request()
//     .input("account_id", sql.BigInt, account.id)
//     .query(`SELECT * FROM institutes WHERE account_id = @account_id`);

//   let institute;
//   if (instituteResult.recordset.length === 0) {
//     const inserted = await pool.request()
//       .input("account_id", sql.BigInt, account.id)
//       .input("phone_number", sql.NVarChar(20), phone_number || null)
//       .input("email", sql.NVarChar(255), email || null)
//       .query(`
//         INSERT INTO institutes (account_id, name, phone_number, email, approval_status, is_active)
//         OUTPUT INSERTED.*
//         VALUES (@account_id, 'Pending', @phone_number, @email, 'PENDING', 1)
//       `);
//     institute = inserted.recordset[0];
//   } else {
//     institute = instituteResult.recordset[0];
//   }

//   return {
//     account,
//     institute,
//     isProfileCompleted: !!(institute.name && institute.name !== 'Pending' && institute.city),
//   };
// };

// /* ── COMPLETE PROFILE ───────────────────────────────────────────────────── */
// export const instituteCompleteProfileService = async (accountId, body) => {
//   const pool = getPool();
//   const {
//     name, description, email, phone_number,
//     logo, banner_image_imager, address, city, state, pincode,
//     categories, // [{ category_id, subcategory_id }] max 5
//   } = body;

//   if (!name || !phone_number || !city) {
//     throw new Error("name, phone_number and city are required");
//   }

//   const result = await pool.request()
//     .input("account_id", sql.BigInt, accountId)
//     .input("name", sql.NVarChar(150), name)
//     .input("description", sql.NVarChar(1000), description || null)
//     .input("email", sql.NVarChar(255), email || null)
//     .input("phone_number", sql.NVarChar(20), phone_number)
//     .input("logo", sql.NVarChar(500), logo || null)
//     .input("banner_image_imager", sql.NVarChar(500), banner_image_imager || null)
//     .input("address", sql.NVarChar(500), address || null)
//     .input("city", sql.NVarChar(100), city)
//     .input("state", sql.NVarChar(100), state || null)
//     .input("pincode", sql.NVarChar(20), pincode || null)
//     .query(`
//       UPDATE institutes SET
//         name = @name, description = @description, email = @email,
//         phone_number = @phone_number, logo = @logo, banner_image_imager = @banner_image_imager,
//         address = @address, city = @city, state = @state, pincode = @pincode,
//         updated_at = SYSDATETIME()
//       OUTPUT INSERTED.*
//       WHERE account_id = @account_id
//     `);

//   if (result.recordset.length === 0) throw new Error("Institute not found");
//   const institute = result.recordset[0];

//   // Replace categories
//   if (categories && categories.length > 0) {
//     await pool.request()
//       .input("institute_id", sql.BigInt, institute.id)
//       .query(`DELETE FROM institute_categories WHERE institute_id = @institute_id`);

//     for (const cat of categories.slice(0, 5)) {
//       await pool.request()
//         .input("institute_id", sql.BigInt, institute.id)
//         .input("category_id", sql.BigInt, parseInt(cat.category_id))
//         .input("subcategory_id", sql.BigInt, cat.subcategory_id ? parseInt(cat.subcategory_id) : null)
//         .query(`
//           INSERT INTO institute_categories (institute_id, category_id, subcategory_id)
//           VALUES (@institute_id, @category_id, @subcategory_id)
//         `);
//     }
//   }

//   return institute;
// };

// /* ── GET INSTITUTE PROFILE ──────────────────────────────────────────────── */
// export const getInstituteProfileService = async (accountId) => {
//   const pool = getPool();

//   const result = await pool.request()
//     .input("account_id", sql.BigInt, accountId)
//     .query(`
//       SELECT i.*,
//         (SELECT COUNT(*) FROM trainers WHERE institute_id = i.id) AS trainer_count,
//         (SELECT COUNT(*) FROM classes WHERE institute_id = i.id AND is_active = 1) AS class_count
//       FROM institutes i
//       WHERE i.account_id = @account_id
//     `);

//   if (result.recordset.length === 0) throw new Error("Institute not found");

//   const institute = result.recordset[0];

//   const cats = await pool.request()
//     .input("institute_id", sql.BigInt, institute.id)
//     .query(`
//       SELECT ic.*, c.name AS category_name, s.name AS subcategory_name
//       FROM institute_categories ic
//       JOIN categories c ON ic.category_id = c.id
//       LEFT JOIN subcategories s ON ic.subcategory_id = s.id
//       WHERE ic.institute_id = @institute_id
//     `);

//   return { ...institute, categories: cats.recordset };
// };

// /* ── LIST ALL INSTITUTES (public) ───────────────────────────────────────── */
// export const listInstitutesService = async ({
//   city,
//   category_id,
//   subcategory_id,
//   page = 1,
//   limit = 20,
// }) => {

//   const pool = getPool();

//   const offset = (page - 1) * limit;

//   let where = `
//     WHERE i.approval_status = 'APPROVED'
//     AND i.is_active = 1
//   `;

//   const request = pool.request()
//     .input("limit", sql.Int, parseInt(limit))
//     .input("offset", sql.Int, offset);

//   // CITY FILTER
//   if (city) {

//     where += ` AND i.city LIKE @city`;

//     request.input(
//       "city",
//       sql.NVarChar(100),
//       `%${city}%`
//     );
//   }

//   // CATEGORY FILTER
//   if (category_id) {

//     where += `
//       AND EXISTS (
//         SELECT 1
//         FROM institute_categories ic
//         WHERE ic.institute_id = i.id
//         AND ic.category_id = @category_id
//       )
//     `;

//     request.input(
//       "category_id",
//       sql.BigInt,
//       parseInt(category_id)
//     );
//   }

//   // SUBCATEGORY FILTER
//   if (subcategory_id) {

//     where += `
//       AND EXISTS (
//         SELECT 1
//         FROM institute_categories ic
//         WHERE ic.institute_id = i.id
//         AND ic.subcategory_id = @subcategory_id
//       )
//     `;

//     request.input(
//       "subcategory_id",
//       sql.BigInt,
//       parseInt(subcategory_id)
//     );
//   }

//   // MAIN QUERY
//   const result = await request.query(`

//     SELECT
//       i.id,
//       i.name,
//       i.description,

//       i.logo,
//       i.banner_image_imager_image AS banner_image_imager,

//       i.image,

//       i.phone_number,

//       i.city,
//       i.state,

//       i.distance,
//       i.rating,
//       i.reviews,

//       i.timing AS timings

//     FROM institutes i

//     ${where}

//     ORDER BY i.created_at DESC

//     OFFSET @offset ROWS
//     FETCH NEXT @limit ROWS ONLY
//   `);

//   const institutes = result.recordset;

  
//   // GET CATEGORIES + REAL CLASS COUNT
// for (const institute of institutes) {

//   // GET CATEGORIES + SUBCATEGORIES
//   const categoriesResult = await pool.request()
//     .input("institute_id", sql.BigInt, institute.id)
//     .query(`
//       SELECT
//         ic.category_id,
//         ic.subcategory_id,
//         c.name AS category_name,
//         s.name AS subcategory_name
//       FROM institute_categories ic
//       JOIN categories c
//         ON ic.category_id = c.id
//       LEFT JOIN subcategories s
//         ON ic.subcategory_id = s.id
//       WHERE ic.institute_id = @institute_id
//     `);

//   institute.categories = categoriesResult.recordset;

//   // GET REAL ACTIVE CLASSES COUNT
//   const classesResult = await pool.request()
//     .input("institute_id", sql.BigInt, institute.id)
//     .query(`
//       SELECT COUNT(*) AS total_classes
//       FROM classes
//       WHERE institute_id = @institute_id
//       AND is_active = 1
//     `);

//   institute.total_classes =
//     classesResult.recordset[0]?.total_classes || 0;


//     // COURSES ARRAY
//     institute.courses =
//       categoriesResult.recordset.map(
//         (c) => c.subcategory_name
//       ).filter(Boolean);

//     // TOTAL CLASSES
//     const classResult = await pool.request()
//       .input("institute_id", sql.BigInt, institute.id)
//       .query(`
//         SELECT COUNT(*) AS total_classes
//         FROM classes
//         WHERE institute_id = @institute_id
//         AND is_active = 1
//       `);

//     institute.total_classes =
//       classResult.recordset[0]?.total_classes || 0;
//   }

//   return institutes;
// };

// // /* ── INSTITUTE TRAINERS ─────────────────────────────────────────────────── */
// export const getInstituteTrainersService = async (instituteId) => {
//   const pool = getPool();
//   const result = await pool.request()
//     .input("institute_id", sql.BigInt, parseInt(instituteId))
//     .query(`
//       SELECT t.id, t.full_name, t.bio, t.experience_years,
//         t.profile_image, t.approval_status, t.is_profile_completed,
//         (SELECT COUNT(*) FROM classes WHERE trainer_id = t.id AND is_active = 1) AS class_count
//       FROM trainers t
//       WHERE t.institute_id = @institute_id AND t.is_active = 1
//     `);
//   return result.recordset;
// };

// /* ── APPROVE / REJECT TRAINER (by institute) ────────────────────────────── */
// export const updateTrainerApprovalService = async (instituteAccountId, trainerId, status, reason) => {
//   const pool = getPool();

//   const instResult = await pool.request()
//     .input("account_id", sql.BigInt, instituteAccountId)
//     .query(`SELECT id FROM institutes WHERE account_id = @account_id`);

//   if (instResult.recordset.length === 0) throw new Error("Institute not found");
//   const instituteId = instResult.recordset[0].id;

//   // Verify trainer belongs to this institute
//   const trainerCheck = await pool.request()
//     .input("trainer_id", sql.BigInt, parseInt(trainerId))
//     .input("institute_id", sql.BigInt, instituteId)
//     .query(`SELECT id FROM trainers WHERE id = @trainer_id AND institute_id = @institute_id`);

//   if (trainerCheck.recordset.length === 0) throw new Error("Trainer not found in your institute");

//   await pool.request()
//     .input("trainer_id", sql.BigInt, parseInt(trainerId))
//     .input("status", sql.NVarChar(20), status)
//     .input("reason", sql.NVarChar(500), reason || null)
//     .query(`
//       UPDATE trainers SET
//         approval_status = @status,
//         rejection_reason = @reason,
//         updated_at = SYSDATETIME()
//       WHERE id = @trainer_id
//     `);

//   return { trainer_id: trainerId, approval_status: status };
// };




// import { getPool, sql } from "../config/db.js";

// /* ─────────────────────────────────────────────
//    LOGIN / AUTO-CREATE ACCOUNT + FETCH INSTITUTES
// ───────────────────────────────────────────── */
// export const instituteLoginService = async (firebaseUser) => {
//   const pool = getPool();
//   const { uid, phone_number, email } = firebaseUser;

//   let accountResult = await pool.request()
//     .input("firebase_uid", sql.NVarChar(255), uid)
//     .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);

//   let account;

//   if (accountResult.recordset.length === 0) {
//     await pool.request()
//       .input("firebase_uid", sql.NVarChar(255), uid)
//       .input("phone_number", sql.NVarChar(20), phone_number || null)
//       .input("email", sql.NVarChar(255), email || null)
//       .query(`
//         MERGE accounts AS target
//         USING (SELECT @firebase_uid AS firebase_uid) AS source
//         ON target.firebase_uid = source.firebase_uid
//         WHEN NOT MATCHED THEN
//           INSERT (firebase_uid, phone_number, email, role, is_active, is_verified)
//           VALUES (@firebase_uid, @phone_number, @email, 'INSTITUTE', 1, 1);
//       `);

//     const inserted = await pool.request()
//       .input("firebase_uid", sql.NVarChar(255), uid)
//       .query(`SELECT * FROM accounts WHERE firebase_uid = @firebase_uid`);

//     account = inserted.recordset[0];
//   } else {
//     account = accountResult.recordset[0];
//   }

//   const institutesResult = await pool.request()
//     .input("account_id", sql.BigInt, account.id)
//     .query(`
//       SELECT * FROM institutes
//       WHERE account_id = @account_id
//       ORDER BY created_at DESC
//     `);

//   return {
//     account,
//     institutes: institutesResult.recordset,
//   };
// };

// /* ─────────────────────────────────────────────
//    CREATE INSTITUTE (MULTI-INSTITUTE SUPPORT)
// ───────────────────────────────────────────── */

//       export const createInstituteService = async (accountId, body = {}) => {
//   const pool = getPool();

//   const {
//     name = "New Institute",
//     description = null,
//     email = null,
//     phone_number = null,
//     logo = null,
//     banner = null,
//     address = null,
//     city = null,
//     state = null,
//     pincode = null,
//     image = null,
//     distance = null,
//     rating = null,
//     reviews = null,
//     timing = null,
//   } = body;

//   const result = await pool.request()
//     .input("account_id", sql.BigInt, accountId)
//     .input("name", sql.NVarChar(150), name)
//     .input("description", sql.NVarChar(1000), description)
//     .input("email", sql.NVarChar(255), email)
//     .input("phone_number", sql.NVarChar(20), phone_number)
//     .input("logo", sql.NVarChar(500), logo)
//     .input("banner", sql.NVarChar(500), banner)
//     .input("address", sql.NVarChar(500), address)
//     .input("city", sql.NVarChar(100), city)
//     .input("state", sql.NVarChar(100), state)
//     .input("pincode", sql.NVarChar(20), pincode)
//     .input("image", sql.NVarChar(500), image)
//     .input("distance", sql.NVarChar(50), distance)
//     .input("rating", sql.Float, rating)
//     .input("reviews", sql.Int, reviews)
//     .input("timing", sql.NVarChar(100), timing)
//     .query(`
//       INSERT INTO institutes (
//         account_id,
//         name,
//         description,
//         email,
//         phone_number,
//         logo,
//         banner,
//         address,
//         city,
//         state,
//         pincode,
//         image,
//         distance,
//         rating,
//         reviews,
//         timing,
//         approval_status,
//         is_active
//       )
//       OUTPUT INSERTED.*
//       VALUES (
//         @account_id,
//         @name,
//         @description,
//         @email,
//         @phone_number,
//         @logo,
//         @banner,
//         @address,
//         @city,
//         @state,
//         @pincode,
//         @image,
//         @distance,
//         @rating,
//         @reviews,
//         @timing,
//         'PENDING',
//         1
//       )
//     `);

//   return result.recordset[0];
// };
// /* ─────────────────────────────────────────────
//    COMPLETE PROFILE
// ───────────────────────────────────────────── */
// export const instituteCompleteProfileService = async (accountId, body) => {
//   const pool = getPool();

//   const {
//     name,
//     description,
//     email,
//     phone_number,
//     logo,
//     banner_image,
//     address,
//     city,
//     state,
//     pincode,
//     categories,
//   } = body;

//   if (!name || !phone_number || !city) {
//     throw new Error("name, phone_number and city are required");
//   }

//   const result = await pool.request()
//     .input("account_id", sql.BigInt, accountId)
//     .input("name", sql.NVarChar(150), name)
//     .input("description", sql.NVarChar(1000), description || null)
//     .input("email", sql.NVarChar(255), email || null)
//     .input("phone_number", sql.NVarChar(20), phone_number)
//     .input("logo", sql.NVarChar(500), logo || null)
//     .input("banner_image", sql.NVarChar(500), banner_image|| null)
//     .input("address", sql.NVarChar(500), address || null)
//     .input("city", sql.NVarChar(100), city)
//     .input("state", sql.NVarChar(100), state || null)
//     .input("pincode", sql.NVarChar(20), pincode || null)
//     .query(`
//       UPDATE institutes SET
//         name=@name,
//         description=@description,
//         email=@email,
//         phone_number=@phone_number,
//         logo=@logo,
//         banner_image=@banner_image,
//         address=@address,
//         city=@city,
//         state=@state,
//         pincode=@pincode,
//         updated_at=SYSDATETIME()
//       OUTPUT INSERTED.*
//       WHERE account_id=@account_id
//     `);

//   if (!result.recordset.length) {
//     throw new Error("Institute not found");
//   }

//   const institute = result.recordset[0];

//   await pool.request()
//     .input("institute_id", sql.BigInt, institute.id)
//     .query(`DELETE FROM institute_categories WHERE institute_id=@institute_id`);

//   for (const cat of (categories || []).slice(0, 5)) {
//     await pool.request()
//       .input("institute_id", sql.BigInt, institute.id)
//       .input("category_id", sql.BigInt, parseInt(cat.category_id))
//       .input("subcategory_id", sql.BigInt, cat.subcategory_id ? parseInt(cat.subcategory_id) : null)
//       .query(`
//         INSERT INTO institute_categories (
//           institute_id, category_id, subcategory_id
//         )
//         VALUES (@institute_id, @category_id, @subcategory_id)
//       `);
//   }

//   return institute;
// };

// /* ─────────────────────────────────────────────
//    GET PROFILE
// ───────────────────────────────────────────── */
// export const getInstituteProfileService = async (accountId) => {
//   const pool = getPool();

//   const result = await pool.request()
//     .input("account_id", sql.BigInt, accountId)
//     .query(`
//       SELECT i.*,
//         (SELECT COUNT(*) FROM trainers WHERE institute_id=i.id) AS trainer_count,
//         (SELECT COUNT(*) FROM classes WHERE institute_id=i.id AND is_active=1) AS class_count
//       FROM institutes i
//       WHERE i.account_id=@account_id
//     `);

//   if (!result.recordset.length) {
//     throw new Error("Institute not found");
//   }

//   const institute = result.recordset[0];

//   const cats = await pool.request()
//     .input("institute_id", sql.BigInt, institute.id)
//     .query(`
//       SELECT ic.*, c.name AS category_name, s.name AS subcategory_name
//       FROM institute_categories ic
//       JOIN categories c ON ic.category_id=c.id
//       LEFT JOIN subcategories s ON ic.subcategory_id=s.id
//       WHERE ic.institute_id=@institute_id
//     `);

//   return { ...institute, categories: cats.recordset };
// };

// /* ─────────────────────────────────────────────
//    LIST INSTITUTES
// ───────────────────────────────────────────── */
// export const listInstitutesService = async ({
//   city,
//   category_id,
//   subcategory_id,
//   page = 1,
//   limit = 20,
// }) => {
//   const pool = getPool();
//   const offset = (page - 1) * limit;

//   let where = `
//     WHERE i.approval_status = 'APPROVED'
//     AND i.is_active = 1
//   `;

//   const request = pool.request()
//     .input("limit", sql.Int, parseInt(limit))
//     .input("offset", sql.Int, offset);

//   if (city) {
//     where += ` AND i.city LIKE @city`;
//     request.input("city", sql.NVarChar(100), `%${city}%`);
//   }

//   if (category_id) {
//     where += `
//       AND EXISTS (
//         SELECT 1 FROM institute_categories ic
//         WHERE ic.institute_id = i.id
//         AND ic.category_id = @category_id
//       )
//     `;
//     request.input("category_id", sql.BigInt, parseInt(category_id));
//   }

//   if (subcategory_id) {
//     where += `
//       AND EXISTS (
//         SELECT 1 FROM institute_categories ic
//         WHERE ic.institute_id = i.id
//         AND ic.subcategory_id = @subcategory_id
//       )
//     `;
//     request.input("subcategory_id", sql.BigInt, parseInt(subcategory_id));
//   }

//   const result = await request.query(`
//     SELECT 
//       i.id,
//       i.name,
//       i.description,
//       i.logo,
//       i.banner_image,
//       i.phone_number,
//       i.city,
//       i.state,
//       i.rating,
//       i.reviews,
//       i.distance,
//       i.timing
//     FROM institutes i
//     ${where}
//     ORDER BY i.created_at DESC
//     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
//   `);

//   const institutes = result.recordset;

//   // ================= ENRICH DATA =================
//   for (const institute of institutes) {

//     // 1. location (frontend expects this)
//     institute.location =
//       `${institute.city || ""}, ${institute.state || ""}`.replace(/^,\s*|,\s*$/g, "");

//     // 2. image (frontend expects this)
//     institute.image = institute.banner_image || institute.logo;

//     // 3. phone
//     institute.phone = institute.phone_number;

//     // ================= COURSES =================
//     const courseResult = await pool.request()
//       .input("institute_id", sql.BigInt, institute.id)
//       .query(`
//         SELECT s.name AS subcategory_name
//         FROM institute_categories ic
//         LEFT JOIN subcategories s ON ic.subcategory_id = s.id
//         WHERE ic.institute_id = @institute_id
//       `);

//     institute.courses = courseResult.recordset
//       .map(c => c.subcategory_name)
//       .filter(Boolean);

//     // ================= FULL CATEGORY STRUCTURE =================
//     const categoryResult = await pool.request()
//       .input("institute_id", sql.BigInt, institute.id)
//       .query(`
//         SELECT 
//           ic.category_id,
//           c.name AS category_name,
//           ic.subcategory_id,
//           s.name AS subcategory_name
//         FROM institute_categories ic
//         LEFT JOIN categories c ON c.id = ic.category_id
//         LEFT JOIN subcategories s ON s.id = ic.subcategory_id
//         WHERE ic.institute_id = @institute_id
//       `);

//     institute.categories = categoryResult.recordset.map(c => ({
//       category_id: c.category_id,
//       category_name: c.category_name,
//       subcategory_id: c.subcategory_id,
//       subcategory_name: c.subcategory_name,
//     }));

//     // ================= IMPORTANT FIX =================
//     // always provide safe defaults (prevents frontend break)
//     institute.rating = institute.rating || 0;
//     institute.reviews = institute.reviews || 0;
//     institute.distance = institute.distance || "";
//     institute.timing = institute.timing || "";
//     institute.description = institute.description || "";

//     // cleanup raw DB fields
//     delete institute.city;
//     delete institute.state;
//     delete institute.logo;
//     delete institute.banner_image;
//     delete institute.phone_number;
//   }

//   return institutes;
// };
// /* ─────────────────────────────────────────────
//    TRAINERS
// ───────────────────────────────────────────── */
// export const getInstituteTrainersService = async (instituteId) => {
//   const pool = getPool();

//   const result = await pool.request()
//     .input("institute_id", sql.BigInt, parseInt(instituteId))
//     .query(`
//       SELECT t.*,
//         (SELECT COUNT(*) FROM classes WHERE trainer_id=t.id AND is_active=1) AS class_count
//       FROM trainers t
//       WHERE t.institute_id=@institute_id AND t.is_active=1
//     `);

//   return result.recordset;
// };

// /* ─────────────────────────────────────────────
//    TRAINER APPROVAL
// ───────────────────────────────────────────── */
// export const updateTrainerApprovalService = async (
//   instituteAccountId,
//   trainerId,
//   status,
//   reason
// ) => {
//   const pool = getPool();

//   const instResult = await pool.request()
//     .input("account_id", sql.BigInt, instituteAccountId)
//     .query(`SELECT id FROM institutes WHERE account_id=@account_id`);

//   if (!instResult.recordset.length) {
//     throw new Error("Institute not found");
//   }

//   const instituteId = instResult.recordset[0].id;

//   const trainerCheck = await pool.request()
//     .input("trainer_id", sql.BigInt, parseInt(trainerId))
//     .input("institute_id", sql.BigInt, instituteId)
//     .query(`
//       SELECT id FROM trainers
//       WHERE id=@trainer_id AND institute_id=@institute_id
//     `);

//   if (!trainerCheck.recordset.length) {
//     throw new Error("Trainer not found in your institute");
//   }

//   await pool.request()
//     .input("trainer_id", sql.BigInt, parseInt(trainerId))
//     .input("status", sql.NVarChar(20), status)
//     .input("reason", sql.NVarChar(500), reason || null)
//     .query(`
//       UPDATE trainers
//       SET approval_status=@status,
//           rejection_reason=@reason
//           updated_at=SYSDATETIME()
//       WHERE id=@trainer_id
//     `);

//   return { trainer_id: trainerId, approval_status: status };
// };

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
    logo = null,
    banner_image = null,
    address = null,
    city = null,
    state = null,
    pincode = null,
    image = null,
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
    .input("logo", sql.NVarChar(500), logo)
    .input("banner_image", sql.NVarChar(500), banner_image)
    .input("address", sql.NVarChar(500), address)
    .input("city", sql.NVarChar(100), city)
    .input("state", sql.NVarChar(100), state)
    .input("pincode", sql.NVarChar(20), pincode)
    .input("image", sql.NVarChar(500), image)
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
        logo,
        banner_image,
        address,
        city,
        state,
        pincode,
        image,
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
        @logo,
        @banner_image,
        @address,
        @city,
        @state,
        @pincode,
        @image,
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
    logo,
    banner_image,
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

  const result = await pool.request()
    .input("account_id", sql.BigInt, accountId)
    .input("name", sql.NVarChar(150), name)
    .input("description", sql.NVarChar(1000), description || null)
    .input("email", sql.NVarChar(255), email || null)
    .input("phone_number", sql.NVarChar(20), phone_number)
    .input("logo", sql.NVarChar(500), logo || null)
    .input("banner_image", sql.NVarChar(500), banner_image || null)
    .input("address", sql.NVarChar(500), address || null)
    .input("city", sql.NVarChar(100), city)
    .input("state", sql.NVarChar(100), state || null)
    .input("pincode", sql.NVarChar(20), pincode || null)
    .input("distance", sql.NVarChar(50), distance || "")
    .input("rating", sql.Float, rating ?? 0)
    .input("reviews", sql.Int, reviews ?? 0)
    .input("timing", sql.NVarChar(100), timing || "")

    .query(`
      UPDATE institutes SET
        name=@name,
        description=@description,
        email=@email,
        phone_number=@phone_number,
        logo=@logo,
        banner_image=@banner_image,
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

  if (!result.recordset.length) {
    throw new Error("Institute not found");
  }

  const institute = result.recordset[0];

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
      i.logo,
      i.banner_image,
      i.phone_number,
      i.city,
      i.state,
      i.rating,
      i.reviews,
      i.distance,
      i.timing

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
    institute.image =
      institute.banner_image ||
      institute.logo ||
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

    // CLEANUP
    delete institute.city;
    delete institute.state;
    delete institute.logo;
    delete institute.banner_image;
    delete institute.phone_number;
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