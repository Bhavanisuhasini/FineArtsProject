import {
  createClassByInstituteService,
  createClassByTrainerService,
  listClassesService,
  getClassByIdService,
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

export const getClass = async (req, res) => {
  try {
    const data = await getClassByIdService(req.params.id);
    res.json({ success: true, data });
  } catch (e) { res.status(404).json({ success: false, message: e.message }); }
};

/* ── INSTITUTE ─────────────────────────────────────────────────────────── */
export const createClassByInstitute = async (req, res) => {
  try {
    const data = await createClassByInstituteService(req.account.id, req.body);
    res.status(201).json({ success: true, message: "Class created successfully", data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
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