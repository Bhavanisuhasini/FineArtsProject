import express from "express";
import * as controller from "../controllers/booking.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, controller.createBooking);
router.get("/my", auth, controller.getMyBookings);

router.get("/class/:classId", controller.getByClass);
router.get("/trainer/:trainerId", controller.getByTrainer);
router.get("/institute/:instituteId", controller.getByInstitute);

router.get("/:id", controller.getBookingById);

router.patch("/:id/cancel", auth, controller.cancelBooking);
router.patch("/:id/confirm", auth, controller.confirmBooking);
router.patch("/:id/complete", auth, controller.completeBooking);

router.post("/check-eligibility", auth, controller.checkEligibility);

export default router;