import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import {
  trainerLogin,
  trainerCompleteProfile,
  getTrainerPublicProfile,
  getMyTrainerProfile,
  updateTrainerQR,
} from "../controllers/trainer.controller.js";

const router = express.Router();

// Public
router.get("/:id",               getTrainerPublicProfile);

// Authenticated
router.post("/login",            firebaseAuth, trainerLogin);
router.put("/complete-profile",  firebaseAuth, accountAuth, trainerCompleteProfile);
router.get("/me/profile",        firebaseAuth, accountAuth, getMyTrainerProfile);
router.put("/me/qr",             firebaseAuth, accountAuth, updateTrainerQR);

export default router;