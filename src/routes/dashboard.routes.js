import express from "express";
import * as controller from "../controllers/dashboard.controller.js";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

const router = express.Router();

router.get("/user",      firebaseAuth, accountAuth, controller.userDashboard);
router.get("/trainer",   firebaseAuth, accountAuth, controller.trainerDashboard);
router.get("/institute", firebaseAuth, accountAuth, controller.instituteDashboard);
router.get("/admin",     firebaseAuth, accountAuth, controller.adminDashboard);

router.get("/admin/revenue",          firebaseAuth, accountAuth, controller.adminRevenue);
router.get("/admin/bookings-summary", firebaseAuth, accountAuth, controller.adminBookingsSummary);
router.get("/admin/users-summary",    firebaseAuth, accountAuth, controller.adminUsersSummary);

export default router;