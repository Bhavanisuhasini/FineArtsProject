import express from "express";

import {
  trainerLogin,
  trainerCompleteProfile,
  getTrainerPublicProfile,
  getMyTrainerProfile,
  updateTrainerQR,
  getAllTrainers,
} from "../controllers/trainer.controller.js";

import firebaseAuth  from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

const router = express.Router();

/* =========================
   AUTH / LOGIN
========================= */
router.post("/login", firebaseAuth, trainerLogin);

/* =========================
   COMPLETE PROFILE
========================= */
router.post(
  "/complete-profile",
  firebaseAuth,
  accountAuth,
  trainerCompleteProfile
);

/* =========================
   MY TRAINERS (FIXED FOR MULTI)
========================= */
router.get(
  "/me",
  firebaseAuth,
  accountAuth,
  getMyTrainerProfile
);

/* =========================
   UPDATE QR
========================= */
router.put(
  "/update-qr",
  firebaseAuth,
  accountAuth,
  updateTrainerQR
);

/* =========================
   ALL TRAINERS
========================= */
router.get("/", getAllTrainers);

/* =========================
   SINGLE TRAINER PROFILE
========================= */
router.get("/:id", getTrainerPublicProfile);

export default router;