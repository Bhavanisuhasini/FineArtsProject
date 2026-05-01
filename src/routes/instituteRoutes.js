import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
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
router.put("/complete-profile",  firebaseAuth, instituteCompleteProfile);
router.get("/profile",           firebaseAuth, getInstituteProfile);

// Public listing
router.get("/",                  listInstitutes);
router.get("/:id/trainers",      getInstituteTrainers);

// Institute manages its trainers
router.put("/trainers/:trainerId/approval", firebaseAuth, updateTrainerApproval);

export default router;