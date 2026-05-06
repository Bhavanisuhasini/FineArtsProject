import express from "express";
import { adminAuth } from "../middlewares/adminAuth.js";

import {
  getAllInstitutes,
  getPendingInstitutes,
  approveInstitute,
  rejectInstitute,
  getAllTrainers,
  getPendingTrainers,
  approveTrainer,
  rejectTrainer,
  getPendingClasses,
  approveClass,
  rejectClass
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(adminAuth);

router.get("/institutes", getAllInstitutes);
router.get("/institutes/pending", getPendingInstitutes);
router.patch("/institutes/:id/approve", approveInstitute);
router.patch("/institutes/:id/reject", rejectInstitute);

router.get("/trainers", getAllTrainers);
router.get("/trainers/pending", getPendingTrainers);
router.patch("/trainers/:id/approve", approveTrainer);
router.patch("/trainers/:id/reject", rejectTrainer);

router.get("/classes/pending", getPendingClasses);
router.patch("/classes/:id/approve", approveClass);
router.patch("/classes/:id/reject", rejectClass);

export default router;