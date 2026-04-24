import express from "express";
import * as c from "../controllers/admin.controller.js";
import * as s from "../services/admin.service.js";
import auth from "../middlewares/auth.middleware.js";
import { admin } from "../middlewares/role.middleware.js";

const router = express.Router();

// protect all
router.use(auth, admin);

/* Institute approvals */
router.get("/pending-institutes", c.getPendingInstitutes);
router.patch("/institutes/:id/approve", c.approveInstitute);
router.patch("/institutes/:id/reject", c.rejectInstitute);

/* Trainer approvals */
router.get("/pending-trainers", c.getPendingTrainers);
router.patch("/trainers/:id/approve", c.approveTrainer);
router.patch("/trainers/:id/reject", c.rejectTrainer);

/* Users */
router.get("/users", c.getUsers);
router.get("/users/:id", c.getUser);
router.patch("/users/:id/status", c.updateUserStatus);

/* Institutes */
router.get("/institutes", c.getAll(s.getAllInstitutes));
router.get("/institutes/:id", c.getById(s.getInstituteById));
router.patch("/institutes/:id/status", c.updateStatus(s.updateInstituteStatus));

/* Trainers */
router.get("/trainers", c.getAll(s.getAllTrainers));
router.get("/trainers/:id", c.getById(s.getTrainerById));
router.patch("/trainers/:id/status", c.updateStatus(s.updateTrainerStatus));

/* Classes */
router.get("/classes", c.getAll(s.getAllClasses));
router.get("/classes/:id", c.getById(s.getClassById));
router.patch("/classes/:id/status", c.updateStatus(s.updateClassStatus));

/* Bookings */
router.get("/bookings", c.getAll(s.getAllBookings));
router.get("/bookings/:id", c.getById(s.getBookingById));

/* Payments */
router.get("/payments", c.getAll(s.getAllPayments));
router.get("/payments/:id", c.getById(s.getPaymentById));

export default router;