import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  requireApprovedInstitute,
  requireApprovedTrainer
} from "../middlewares/approval.middleware.js";
import {
  createClassByInstitute,
  createClassByTrainer
} from "../controllers/class.controller.js";

const router = express.Router();

router.post(
  "/institute",
  requireAuth,
  allowRoles("INSTITUTE"),
  requireApprovedInstitute,
  createClassByInstitute
);

router.post(
  "/trainer",
  requireAuth,
  allowRoles("TRAINER"),
  requireApprovedTrainer,
  createClassByTrainer
);

export default router;