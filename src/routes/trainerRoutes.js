import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
import { trainerLogin, trainerCompleteProfile } from "../controllers/trainer.controller.js";

const router = express.Router();

router.post("/login", firebaseAuth, trainerLogin);
router.put("/complete-profile", firebaseAuth, trainerCompleteProfile);

export default router;