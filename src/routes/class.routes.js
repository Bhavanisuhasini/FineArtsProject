import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
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
router.get("/",    listClasses);
router.get("/:id", getClass);

/* ── INSTITUTE ───────────────────────────────────────────────────────────── */
router.post("/institute/create",      firebaseAuth, accountAuth, createClassByInstitute);
router.put("/institute/:id",          firebaseAuth, accountAuth, updateClass);
router.delete("/institute/:id",       firebaseAuth, accountAuth, deleteClass);

router.post("/institute/add-trainer",                    firebaseAuth, accountAuth, addTrainerToInstitute);
router.get("/institute/trainer-applications",            firebaseAuth, accountAuth, getTrainerApplications);
router.patch("/institute/trainer-applications/:trainerId", firebaseAuth, accountAuth, respondToTrainerApplication);

/* ── TRAINER ─────────────────────────────────────────────────────────────── */
router.post("/trainer/create",          firebaseAuth, accountAuth, createClassByTrainer);
router.put("/trainer/:id",              firebaseAuth, accountAuth, updateClass);
router.delete("/trainer/:id",           firebaseAuth, accountAuth, deleteClass);
router.post("/trainer/apply-institute", firebaseAuth, accountAuth, applyToInstitute);

export default router;