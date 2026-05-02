import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
import {
  createClassByInstitute,
  createClassByTrainer,
  listClasses,
  getClass,
  updateClass,
  deleteClass,
  applyToInstitute,
  addTrainerToInstitute,
  getTrainerApplications,
  respondToTrainerApplication,
} from "../controllers/class.controller.js";

const router = express.Router();

/* ── PUBLIC ──────────────────────────────────────────────────────────────── */
router.get("/",    listClasses);   // GET /api/classes?category_id=1&level=BEGINNER...
router.get("/:id", getClass);      // GET /api/classes/1

/* ── INSTITUTE ───────────────────────────────────────────────────────────── */
// Class management
router.post("/institute/create",      firebaseAuth, createClassByInstitute);
router.put("/institute/:id",          firebaseAuth, updateClass);
router.delete("/institute/:id",       firebaseAuth, deleteClass);

// Trainer management
router.post("/institute/add-trainer",                    firebaseAuth, addTrainerToInstitute);
router.get("/institute/trainer-applications",            firebaseAuth, getTrainerApplications);
router.patch("/institute/trainer-applications/:trainerId", firebaseAuth, respondToTrainerApplication);

/* ── TRAINER ─────────────────────────────────────────────────────────────── */
router.post("/trainer/create",          firebaseAuth, createClassByTrainer);
router.put("/trainer/:id",              firebaseAuth, updateClass);
router.delete("/trainer/:id",           firebaseAuth, deleteClass);
router.post("/trainer/apply-institute", firebaseAuth, applyToInstitute);

export default router;