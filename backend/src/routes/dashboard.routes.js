import express from "express";
import * as controller from "../controllers/dashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { admin } from "../middlewares/role.middleware.js";

const router = express.Router();

// user
router.get("/user", auth, controller.userDashboard);

// trainer
router.get("/trainer", auth, controller.trainerDashboard);

// institute
router.get("/institute", auth, controller.instituteDashboard);

// admin
router.get("/admin", auth, admin, controller.adminDashboard);
router.get("/admin/revenue", auth, admin, controller.revenueReport);
router.get("/admin/bookings-summary", auth, admin, controller.bookingSummary);
router.get("/admin/users-summary", auth, admin, controller.userSummary);

export default router;