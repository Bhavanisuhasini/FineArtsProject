import express from "express";
import {
  getMyNotificationsHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  sendNotificationHandler,
} from "../controllers/notification.controller.js";
import firebaseAuth  from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

const router = express.Router();

router.get("/my",          firebaseAuth, accountAuth, getMyNotificationsHandler);
router.patch("/:id/read",  firebaseAuth, accountAuth, markAsReadHandler);
router.patch("/read-all",  firebaseAuth, accountAuth, markAllAsReadHandler);
router.post("/send",       firebaseAuth, accountAuth, sendNotificationHandler);

export default router;
