import express from "express";
import * as controller from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-order", requireAuth, controller.createPaymentOrder);
router.post("/verify", requireAuth, controller.verifyPayment);
router.post("/", requireAuth, controller.savePayment);

router.get("/my", requireAuth, controller.getMyPayments);
router.get("/booking/:bookingId", requireAuth, controller.getPaymentByBookingId);

router.post("/:id/refund", requireAuth, controller.refundPayment);

// webhook usually should NOT use Firebase auth
router.post("/webhook", controller.paymentWebhook);

export default router;