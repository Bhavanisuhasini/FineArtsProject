import {
  getQRDetailsService,
  submitPaymentService,
  getPendingPaymentsService,
  verifyPaymentService,
  rejectPaymentService,
  getMyPaymentsService,
  getQRSettingsService,
} from "../services/payment.service.js";

/* ── PUBLIC: GET QR + AMOUNT FOR A CLASS ───────────────────────────────── */
export const getQRDetails = async (req, res) => {
  try {
    const data = await getQRDetailsService(req.params.classId);
    res.json({ success: true, data });
  } catch (e) { res.status(404).json({ success: false, message: e.message }); }
};

/* ── USER: SUBMIT PAYMENT AFTER SCANNING QR ────────────────────────────── */
export const submitPayment = async (req, res) => {
  try {
    const data = await submitPaymentService(req.account.id, req.body);
    res.status(201).json({ success: true, message: data.message, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── USER: GET MY PAYMENTS ──────────────────────────────────────────────── */
export const getMyPayments = async (req, res) => {
  try {
    const data = await getMyPaymentsService(req.account.id);
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── ADMIN/INSTITUTE: GET PENDING PAYMENTS TO VERIFY ───────────────────── */
export const getPendingPayments = async (req, res) => {
  try {
    const data = await getPendingPaymentsService();
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── ADMIN/INSTITUTE: VERIFY PAYMENT → CONFIRM BOOKING ─────────────────── */
export const verifyPayment = async (req, res) => {
  try {
    const data = await verifyPaymentService(req.account.id, req.params.id);
    res.json({ success: true, message: data.message, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── ADMIN/INSTITUTE: REJECT PAYMENT ────────────────────────────────────── */
export const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const data = await rejectPaymentService(req.account.id, req.params.id, reason);
    res.json({ success: true, message: data.message, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};

/* ── GET QR SETTINGS ────────────────────────────────────────────────────── */
export const getQRSettings = async (req, res) => {
  try {
    const data = await getQRSettingsService();
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
};