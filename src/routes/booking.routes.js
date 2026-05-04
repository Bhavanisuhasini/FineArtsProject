import express from "express";
import * as controller from "../controllers/booking.controller.js";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

const router = express.Router();

router.post("/", firebaseAuth, accountAuth, controller.createBooking);
router.get("/my", firebaseAuth, accountAuth, controller.getMyBookings);

router.get("/class/:classId", controller.getByClass);
router.get("/trainer/:trainerId", controller.getByTrainer);
router.get("/institute/:instituteId", controller.getByInstitute);

router.get("/:id", firebaseAuth, accountAuth, controller.getBookingById);

router.patch("/:id/cancel", firebaseAuth, accountAuth, controller.cancelBooking);
router.patch("/:id/confirm", firebaseAuth, accountAuth, controller.confirmBooking);
router.patch("/:id/complete", firebaseAuth, accountAuth, controller.completeBooking);

router.post("/check-eligibility", firebaseAuth, accountAuth, controller.checkEligibility);

export default router;