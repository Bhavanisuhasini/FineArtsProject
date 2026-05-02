import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
import {
  getQRDetails,
  submitPayment,
  getMyPayments,
  getPendingPayments,
  verifyPayment,
  rejectPayment,
  getQRSettings,
} from "../controllers/payment.controller.js";

const router = express.Router();

/* ── PUBLIC ──────────────────────────────────────────────────────────────── */
// Get QR code + amount for a class before booking
router.get("/qr/:classId", getQRDetails);

// Get QR settings (UPI ID, payee name)
router.get("/qr-settings", getQRSettings);

/* ── USER (authenticated) ────────────────────────────────────────────────── */
// Submit payment after scanning QR and paying
router.post("/submit", firebaseAuth, submitPayment);

// View my payment history
router.get("/my", firebaseAuth, getMyPayments);

/* ── ADMIN / INSTITUTE (authenticated) ───────────────────────────────────── */
// View all pending payments waiting for verification
router.get("/pending", firebaseAuth, getPendingPayments);

// Verify a payment → booking gets CONFIRMED
router.patch("/:id/verify", firebaseAuth, verifyPayment);

// Reject a payment → booking gets CANCELLED
router.patch("/:id/reject", firebaseAuth, rejectPayment);

export default router;