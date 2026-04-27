import express from "express";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

import {
  getPendingInstitutes,
  approveInstitute,
  rejectInstitute,
  getPendingTrainers,
  approveTrainer,
  rejectTrainer
} from "../controllers/admin.controller.js";

const router = express.Router();

// Admin username/password JWT auth
router.use(adminAuth);

router.get("/pending-institutes", getPendingInstitutes);
router.patch("/institutes/:id/approve", approveInstitute);
router.patch("/institutes/:id/reject", rejectInstitute);

router.get("/pending-trainers", getPendingTrainers);
router.patch("/trainers/:id/approve", approveTrainer);
router.patch("/trainers/:id/reject", rejectTrainer);

export default router;