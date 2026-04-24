import express from "express";
import * as controller from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-order", auth, controller.createOrder);
router.post("/verify", controller.verifyPayment);
router.post("/", auth, controller.savePayment);

router.get("/booking/:bookingId", controller.getByBooking);
router.get("/my", auth, controller.getMyPayments);

router.post("/:id/refund", auth, controller.refundPayment);

router.post("/webhook", controller.webhook);

export default router;