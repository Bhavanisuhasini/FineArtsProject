import express from "express";
import  firebaseAuth from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

import {
  getTrainerDashboard,
  getTrainerBookings,
  getTrainerStudents,
  createSession,
} from "../controllers/trainer.dashboard.controller.js";

const router = express.Router();

router.get("/dashboard", firebaseAuth, accountAuth, getTrainerDashboard);
router.get("/bookings", firebaseAuth, accountAuth, getTrainerBookings);
router.get("/students", firebaseAuth, accountAuth, getTrainerStudents);
router.post("/create-session", firebaseAuth, accountAuth, createSession);

export default router;