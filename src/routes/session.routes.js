import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import {
  createSession,
  updateSession,
  cancelSession,
  getTrainerToday,
  getTrainerUpcoming,
  getUserToday,
  getUserUpcoming,
  getClassSessions,
} from "../controllers/session.controller.js";

const router = express.Router();

/* ── PUBLIC ─────────────────────────────────────────────────────────────── */
// Get all sessions for a class (no zoom link exposed publicly)
router.get("/class/:classId", getClassSessions);

/* ── TRAINER ────────────────────────────────────────────────────────────── */
// Post a new session with Zoom link
router.post("/",              firebaseAuth, accountAuth, createSession);
// Update session (change Zoom link, reschedule, etc.)
router.put("/:id",            firebaseAuth, accountAuth, updateSession);
// Cancel a session
router.patch("/:id/cancel",   firebaseAuth, accountAuth, cancelSession);
// My sessions today
router.get("/trainer/today",  firebaseAuth, accountAuth, getTrainerToday);
// My upcoming sessions (?days=7)
router.get("/trainer/upcoming", firebaseAuth, accountAuth, getTrainerUpcoming);

/* ── USER ───────────────────────────────────────────────────────────────── */
// My classes today with Join button
router.get("/user/today",     firebaseAuth, accountAuth, getUserToday);
// My upcoming sessions (?days=7)
router.get("/user/upcoming",  firebaseAuth, accountAuth, getUserUpcoming);

export default router;
