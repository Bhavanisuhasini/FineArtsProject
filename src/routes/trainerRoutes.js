import express from "express";
import { firebaseAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { requireApprovedInstitute } from "../middlewares/approval.middleware.js";
import {
  trainerSignup,
  trainerSignin,
  addTrainerByInstitute
} from "../controllers/trainer.controller.js";

const router = express.Router();

router.post("/signup", firebaseAuth, trainerSignup);

router.post(
  "/signin",
  requireAuth,
  allowRoles("TRAINER"),
  trainerSignin
);

router.post(
  "/add-by-institute",
  requireAuth,
  allowRoles("INSTITUTE"),
  requireApprovedInstitute,
  addTrainerByInstitute
);

export default router;