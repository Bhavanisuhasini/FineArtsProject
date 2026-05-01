import express from "express";
import * as controller from "../controllers/dashboard.controller.js";
import { firebaseAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Each role hits their own endpoint with their Firebase token
router.get("/user",      firebaseAuth, controller.userDashboard);
router.get("/trainer",   firebaseAuth, controller.trainerDashboard);
router.get("/institute", firebaseAuth, controller.instituteDashboard);
router.get("/admin",     firebaseAuth, controller.adminDashboard);

// Admin reports
router.get("/admin/revenue",          firebaseAuth, controller.adminRevenue);
router.get("/admin/bookings-summary", firebaseAuth, controller.adminBookingsSummary);
router.get("/admin/users-summary",    firebaseAuth, controller.adminUsersSummary);

export default router;