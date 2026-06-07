import express from "express";
import firebaseAuth from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import {
  createSession,
  updateSession,
  cancelSession,
  getTrainerToday,
  getTrainerUpcoming,
  getTrainerPendingBookings, // ✅ NEW
  getUserToday,
  getUserUpcoming,
  getClassSessions,
} from "../controllers/session.controller.js";

const router = express.Router();

/* ── PUBLIC ─────────────────────────────────────────── */
router.get("/class/:classId", getClassSessions);

/* ── TRAINER ─────────────────────────────────────────── */
router.post("/",                    firebaseAuth, accountAuth, createSession);
router.put("/:id",                  firebaseAuth, accountAuth, updateSession);
router.patch("/:id/cancel",         firebaseAuth, accountAuth, cancelSession);
router.get("/trainer/today",        firebaseAuth, accountAuth, getTrainerToday);
router.get("/trainer/upcoming",     firebaseAuth, accountAuth, getTrainerUpcoming);
router.get("/trainer/pending",      firebaseAuth, accountAuth, getTrainerPendingBookings); // ✅ NEW

/* ── USER ─────────────────────────────────────────────── */
router.get("/user/today",           firebaseAuth, accountAuth, getUserToday);
router.get("/user/upcoming",        firebaseAuth, accountAuth, getUserUpcoming);

export default router;