import {
  getPendingInstitutesService,
  approveInstituteService,
  rejectInstituteService,
  getPendingTrainersService,
  approveTrainerService,
  rejectTrainerService,
  getPendingClassesService,
  approveClassService,
  rejectClassService,
  getAllInstitutesService,
  getAllTrainersService,
} from "../services/admin.service.js";

/* ── INSTITUTES ─────────────────────────────────────────────────────────── */
export const getPendingInstitutes = async (req, res) => {
  try {
    const data = await getPendingInstitutesService();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllInstitutes = async (req, res) => {
  try {
    const data = await getAllInstitutesService(req.query);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const approveInstitute = async (req, res) => {
  try {
    const data = await approveInstituteService(req.params.id);
    res.json({ success: true, message: "Institute approved", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const rejectInstitute = async (req, res) => {
  try {
    const data = await rejectInstituteService(req.params.id, req.body.reason);
    res.json({ success: true, message: "Institute rejected", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

/* ── TRAINERS ───────────────────────────────────────────────────────────── */
export const getPendingTrainers = async (req, res) => {
  try {
    const data = await getPendingTrainersService();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllTrainers = async (req, res) => {
  try {
    const data = await getAllTrainersService(req.query);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const approveTrainer = async (req, res) => {
  try {
    const data = await approveTrainerService(req.params.id);
    res.json({ success: true, message: "Trainer approved", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const rejectTrainer = async (req, res) => {
  try {
    const data = await rejectTrainerService(req.params.id, req.body.reason);
    res.json({ success: true, message: "Trainer rejected", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

/* ── CLASSES ────────────────────────────────────────────────────────────── */
export const getPendingClasses = async (req, res) => {
  try {
    const data = await getPendingClassesService();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const approveClass = async (req, res) => {
  try {
    const data = await approveClassService(req.params.id);
    res.json({ success: true, message: "Class approved and is now live", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const rejectClass = async (req, res) => {
  try {
    const data = await rejectClassService(req.params.id, req.body.reason);
    res.json({ success: true, message: "Class rejected", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};