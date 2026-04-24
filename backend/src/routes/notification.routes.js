import express from "express";
import * as controller from "../controllers/notification.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { admin } from "../middlewares/role.middleware.js";

const router = express.Router();

// user
router.get("/my", auth, controller.getMyNotifications);
router.patch("/:id/read", auth, controller.markAsRead);
router.patch("/read-all", auth, controller.markAllRead);

// admin/system
router.post("/send", auth, admin, controller.sendNotification);

export default router;