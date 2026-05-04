import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import {
  instituteLogin,
  instituteCompleteProfile,
  getInstituteProfile,
  listInstitutes,
  getInstituteTrainers,
  updateTrainerApproval,
} from "../controllers/institute.controller.js";

const router = express.Router();

// Auth
router.post("/login",            firebaseAuth, instituteLogin);
router.put("/complete-profile",  firebaseAuth, accountAuth, instituteCompleteProfile);
router.get("/profile",           firebaseAuth, accountAuth, getInstituteProfile);

// Public listing
router.get("/",                  listInstitutes);
router.get("/:id/trainers",      getInstituteTrainers);

// Institute manages its trainers
router.put("/trainers/:trainerId/approval", firebaseAuth, accountAuth, updateTrainerApproval);

export default router;