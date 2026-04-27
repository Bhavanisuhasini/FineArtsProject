import express from "express";
import * as controller from "../controllers/booking.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, controller.createBooking);
router.get("/my", requireAuth, controller.getMyBookings);

router.get("/class/:classId", controller.getByClass);
router.get("/trainer/:trainerId", controller.getByTrainer);
router.get("/institute/:instituteId", controller.getByInstitute);

router.get("/:id", requireAuth, controller.getBookingById);

router.patch("/:id/cancel", requireAuth, controller.cancelBooking);
router.patch("/:id/confirm", requireAuth, controller.confirmBooking);
router.patch("/:id/complete", requireAuth, controller.completeBooking);

router.post("/check-eligibility", requireAuth, controller.checkEligibility);

export default router;