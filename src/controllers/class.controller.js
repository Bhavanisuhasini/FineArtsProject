import sql from "mssql";
import { getPool } from "../config/db.js";
import {
  createClassByInstituteService,
  createClassByTrainerService,
  listClassesService,
  getClassByIdService,
  getClassesService,
  updateClassService,
  deleteClassService,
  trainerApplyToInstituteService,
  instituteRespondToTrainerService,
  instituteAddTrainerService,
  getInstituteTrainerApplicationsService,
} from "../services/class.service.js";

/* ── PUBLIC ────────────────────────────────────────────────────────────── */
export const listClasses = async (req, res) => {
  try {
    const data = await listClassesService(req.query);
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};



export const getClasses = async (req, res) => {
  try {
    const data = await getClassesService(req.query);
    res.json(data); // IMPORTANT: frontend expects ARRAY directly
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};



/* ── INSTITUTE ─────────────────────────────────────────────────────────── */
// export const createClassByInstitute = async (req, res) => {
//   try {
//     const data = await createClassByInstituteService(req.account.id, req.body);
//     res.status(201).json({ success: true, message: "Class created successfully", data });
//   } catch (e) { res.status(400).json({ success: false, message: e.message }); }
// };
export const createClassByInstitute = async (req, res) => {
  try {

    const accountId = req.account?.id || null;

    const data = await createClassByInstituteService(
      accountId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data,
    });

  } catch (e) {
    console.log(e);

    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};



export const updateClass = async (req, res) => {
  try {
    const data = await updateClassService(req.account.id, req.params.id, req.account.role, req.body);
    res.json({ success: true, message: "Class updated", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

export const deleteClass = async (req, res) => {
  try {
    const data = await deleteClassService(req.account.id, req.params.id, req.account.role);
    res.json({ success: true, message: "Class removed", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// Institute adds a trainer directly
export const addTrainerToInstitute = async (req, res) => {
  try {
    const data = await instituteAddTrainerService(req.account.id, req.body);
    res.status(201).json({ success: true, message: "Trainer added to institute successfully", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// Institute views pending trainer applications
export const getTrainerApplications = async (req, res) => {
  try {
    const data = await getInstituteTrainerApplicationsService(req.account.id);
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// Institute accepts or rejects a trainer application
export const respondToTrainerApplication = async (req, res) => {
  try {
    const { action } = req.body; // "accept" or "reject"
    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }
    const data = await instituteRespondToTrainerService(req.account.id, req.params.trainerId, action);
    res.json({ success: true, message: `Trainer ${action}ed successfully`, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── TRAINER ───────────────────────────────────────────────────────────── */
export const createClassByTrainer = async (req, res) => {
  try {
    const data = await createClassByTrainerService(req.account.id, req.body);
    res.status(201).json({ success: true, message: "Class created successfully", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

// Trainer applies to join an institute
export const applyToInstitute = async (req, res) => {
  try {
    const { institute_id } = req.body;
    if (!institute_id) return res.status(400).json({ message: "institute_id is required" });
    const data = await trainerApplyToInstituteService(req.account.id, institute_id);
    res.json({ success: true, message: "Application submitted. Waiting for institute approval.", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};



/* =========================
   CREATE CLASS
========================= */

export const createClass = async (req, res) => {
  try {
    const pool = getPool();

    const {
      title,
      description,
      category_id,
      subcategory_id,
      trainer_id,
      institute_id,
      price,
      duration,
      level,
      mode,
      max_students,
      thumbnail,
      demo_video_url,
      schedule,
      requirements,
      language,
      status,
      is_active,
    } = req.body;

    const result = await pool.request()
      .input("title", sql.NVarChar(255), title)
      .input("description", sql.NVarChar(sql.MAX), description)
      .input("category_id", sql.BigInt, category_id)
      .input("subcategory_id", sql.BigInt, subcategory_id)
      .input("trainer_id", sql.BigInt, trainer_id)
      .input("institute_id", sql.BigInt, institute_id)
      .input("price", sql.Decimal(10, 2), price)
      .input("duration", sql.NVarChar(100), duration)
      .input("level", sql.NVarChar(50), level)
      .input("mode", sql.NVarChar(50), mode)
      .input("max_students", sql.Int, max_students)
      .input("thumbnail", sql.NVarChar(500), thumbnail)
      .input("demo_video_url", sql.NVarChar(500), demo_video_url)
      .input("schedule", sql.NVarChar(500), schedule)
      .input("requirements", sql.NVarChar(sql.MAX), requirements)
      .input("language", sql.NVarChar(100), language)
      .input("status", sql.NVarChar(50), status)
      .input("is_active", sql.Bit, is_active)
      .query(`
        INSERT INTO classes
        (
          title,
          description,
          category_id,
          subcategory_id,
          trainer_id,
          institute_id,
          price,
          duration,
          level,
          mode,
          max_students,
          thumbnail,
          demo_video_url,
          schedule,
          requirements,
          language,
          status,
          is_active
        )
        OUTPUT INSERTED.*
        VALUES
        (
          @title,
          @description,
          @category_id,
          @subcategory_id,
          @trainer_id,
          @institute_id,
          @price,
          @duration,
          @level,
          @mode,
          @max_students,
          @thumbnail,
          @demo_video_url,
          @schedule,
          @requirements,
          @language,
          @status,
          @is_active
        )
      `);

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: result.recordset[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET ALL CLASSES
========================= */

export const getAllClasses = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT * FROM classes
      ORDER BY id DESC
    `);

    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET CLASS BY ID
========================= */

export const getClassById = async (req, res) => {
  try {
    const data = await getClassByIdService(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


export const getClassesByTrainer = async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input("trainer_id", sql.BigInt, req.params.trainerId)
      .query(`
        SELECT *
        FROM classes
        WHERE trainer_id = @trainer_id
        ORDER BY id DESC
      `);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createClassByAdmin = async (req, res) => {
  try {
    const pool = getPool();

    const {
      title,
      description,
      category_id,
      subcategory_id,
      trainer_id,
      institute_id,
      price,
      duration,
      level,
      mode,
    } = req.body;

    const result = await pool.request()
      .input("title", sql.NVarChar(150), title)
      .input("description", sql.NVarChar(1000), description || null)
      .input("category_id", sql.BigInt, category_id)
      .input("subcategory_id", sql.BigInt, subcategory_id || null)
      .input("trainer_id", sql.BigInt, trainer_id || null)
      .input("institute_id", sql.BigInt, institute_id || null)
      .input("price", sql.Decimal(10,2), price || 0)
      .input("duration", sql.Int, duration || 60)
      .input("level", sql.NVarChar(20), level || "BEGINNER")
      .input("mode", sql.NVarChar(20), mode || "ONLINE")
      .query(`
        INSERT INTO classes (
          title,
          description,
          institute_id,
          trainer_id,
          category_id,
          subcategory_id,
          price,
          duration,
          level,
          mode,
          status,
          is_active
        )
        OUTPUT INSERTED.*
        VALUES (
          @title,
          @description,
          @institute_id,
          @trainer_id,
          @category_id,
          @subcategory_id,
          @price,
          @duration,
          @level,
          @mode,
          'ACTIVE',
          1
        )
      `);

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: result.recordset[0],
    });

  } catch (e) {
    res.status(400).json({
      success: false,
      message: e.message,
    });
  }
};