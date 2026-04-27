import express from "express";
import * as controller from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my", requireAuth, controller.getMyNotifications);

router.patch("/:id/read", requireAuth, controller.markAsRead);

router.patch("/read-all", requireAuth, controller.markAllAsRead);

router.post("/send", requireAuth, controller.sendNotification);

export default router;