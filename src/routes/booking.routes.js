import express from "express";
import firebaseAuth from "../middlewares/firebaseAuth.js";

import {
  createBookingHandler,
  getUserBookingsHandler,
  getBookingByIdHandler,
  updateStatusHandler,
  checkEligibilityHandler,
} from "../controllers/booking.controller.js";

const router = express.Router();

/* ── IMPORTANT: KEEP SPECIFIC ROUTES FIRST ───────────── */

// ✅ GET all bookings of logged-in user
router.get("/my-bookings", firebaseAuth, getUserBookingsHandler);

// ✅ CREATE booking
router.post("/", firebaseAuth, createBookingHandler);

// ✅ CHECK eligibility
router.post("/eligibility", firebaseAuth, checkEligibilityHandler);

// ✅ UPDATE booking status
router.patch("/:id/status", firebaseAuth, updateStatusHandler);

// ✅ GET single booking (KEEP LAST)
router.get("/:id", firebaseAuth, getBookingByIdHandler);

export default router;