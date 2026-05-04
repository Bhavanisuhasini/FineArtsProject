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
  } catch (e) {
    res.status(404).json({ success: false, message: e.message });
  }
};

/* ── PUBLIC: GET PLATFORM QR SETTINGS ──────────────────────────────────── */
export const getQRSettings = async (req, res) => {
  try {
    const data = await getQRSettingsService();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch QR settings" });
  }
};

/* ── USER: SUBMIT PAYMENT AFTER SCANNING QR ────────────────────────────── */
export const submitPayment = async (req, res) => {
  try {
    const data = await submitPaymentService(req.account.id, req.body);
    res.status(201).json({
      success: true,
      message: data.message,
      data,
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* ── USER: GET MY PAYMENT HISTORY ──────────────────────────────────────── */
export const getMyPayments = async (req, res) => {
  try {
    const data = await getMyPaymentsService(req.account.id);
    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch your payment history" });
  }
};

/* ── ADMIN/INSTITUTE: GET PENDING PAYMENTS TO VERIFY ───────────────────── */
export const getPendingPayments = async (req, res) => {
  try {
    const data = await getPendingPaymentsService();
    res.json({
      success: true,
      count: data.length,
      message: data.length === 0 ? "No pending payments to verify" : `${data.length} payment(s) awaiting verification`,
      data,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch pending payments" });
  }
};

/* ── ADMIN/INSTITUTE: VERIFY PAYMENT ───────────────────────────────────── */
export const verifyPayment = async (req, res) => {
  try {
    const data = await verifyPaymentService(req.account.id, req.params.id);
    res.json({ success: true, message: data.message, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* ── ADMIN/INSTITUTE: REJECT PAYMENT ────────────────────────────────────── */
export const rejectPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason so the user understands what went wrong",
      });
    }
    const data = await rejectPaymentService(req.account.id, req.params.id, reason);
    res.json({ success: true, message: data.message, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
