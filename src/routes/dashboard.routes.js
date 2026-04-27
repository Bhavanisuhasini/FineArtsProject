import express from "express";
import * as controller from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/user", requireAuth, allowRoles("USER"), controller.userDashboard);

router.get("/trainer", requireAuth, allowRoles("TRAINER"), controller.trainerDashboard);

router.get("/institute", requireAuth, allowRoles("INSTITUTE"), controller.instituteDashboard);

router.get("/admin", requireAuth, allowRoles("ADMIN"), controller.adminDashboard);

router.get("/admin/revenue", requireAuth, allowRoles("ADMIN"), controller.adminRevenue);

router.get(
  "/admin/bookings-summary",
  requireAuth,
  allowRoles("ADMIN"),
  controller.adminBookingsSummary
);

router.get(
  "/admin/users-summary",
  requireAuth,
  allowRoles("ADMIN"),
  controller.adminUsersSummary
);

export default router;