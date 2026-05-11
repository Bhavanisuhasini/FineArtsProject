import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import * as emailController from "../controllers/emailController.js";

const router = express.Router();

// Send welcome email (called after signup)
router.post("/send-welcome", firebaseAuth, accountAuth, emailController.sendWelcomeEmail);

// Send booking confirmation
router.post("/send-booking-confirmation", firebaseAuth, accountAuth, emailController.sendBookingConfirmation);

// Send payment confirmation
router.post("/send-payment-confirmation", firebaseAuth, accountAuth, emailController.sendPaymentConfirmation);

// Send class notification
router.post("/send-class-notification", firebaseAuth, accountAuth, emailController.sendClassNotification);

// Send booking cancellation
router.post("/send-cancellation", firebaseAuth, accountAuth, emailController.sendBookingCancellation);

// Get email status
router.get("/status/:eventId", firebaseAuth, accountAuth, emailController.getEmailStatus);

export default router;