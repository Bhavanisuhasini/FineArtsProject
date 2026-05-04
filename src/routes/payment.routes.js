import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
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
router.post("/submit", firebaseAuth, accountAuth, submitPayment);
router.get("/my", firebaseAuth, accountAuth, getMyPayments);

/* ── ADMIN / INSTITUTE (authenticated) ───────────────────────────────────── */
router.get("/pending", firebaseAuth, accountAuth, getPendingPayments);
router.patch("/:id/verify", firebaseAuth, accountAuth, verifyPayment);
router.patch("/:id/reject", firebaseAuth, accountAuth, rejectPayment);

export default router;