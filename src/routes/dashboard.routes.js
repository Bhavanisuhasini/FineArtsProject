import express from "express";
import * as controller from "../controllers/dashboard.controller.js";
import  firebaseAuth  from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/user", firebaseAuth, accountAuth, controller.userDashboard);
router.get("/trainer", firebaseAuth, accountAuth, controller.trainerDashboard);
router.get("/institute", firebaseAuth, accountAuth, controller.instituteDashboard);

router.get("/admin", adminAuth, controller.adminDashboard);
router.get("/admin/revenue", adminAuth, controller.adminRevenue);
router.get("/admin/bookings-summary", adminAuth, controller.adminBookingsSummary);
router.get("/admin/users-summary", adminAuth, controller.adminUsersSummary);

export default router;