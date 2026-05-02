import express from "express";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";
import {
  getPendingInstitutes,
  getAllInstitutes,
  approveInstitute,
  rejectInstitute,
  getPendingTrainers,
  getAllTrainers,
  approveTrainer,
  rejectTrainer,
  getPendingClasses,
  approveClass,
  rejectClass,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes protected by admin JWT auth
router.use(adminAuth);

/* ── INSTITUTES ──────────────────────────────────────────────────────────── */
router.get("/institutes",                   getAllInstitutes);          // ?status=PENDING|APPROVED|REJECTED
router.get("/institutes/pending",           getPendingInstitutes);
router.patch("/institutes/:id/approve",     approveInstitute);
router.patch("/institutes/:id/reject",      rejectInstitute);          // body: { reason }

/* ── TRAINERS ────────────────────────────────────────────────────────────── */
router.get("/trainers",                     getAllTrainers);            // ?status=PENDING|APPROVED|REJECTED
router.get("/trainers/pending",             getPendingTrainers);
router.patch("/trainers/:id/approve",       approveTrainer);
router.patch("/trainers/:id/reject",        rejectTrainer);            // body: { reason }

/* ── CLASSES (independent trainer classes need admin approval) ───────────── */
router.get("/classes/pending",              getPendingClasses);
router.patch("/classes/:id/approve",        approveClass);
router.patch("/classes/:id/reject",         rejectClass);              // body: { reason }

export default router;