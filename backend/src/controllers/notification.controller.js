import * as service from "../services/notification.service.js";
import { success } from "../utils/response.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    success(res, await service.getMyNotifications(req.user.id));
  } catch (e) { next(e); }
};

export const markAsRead = async (req, res, next) => {
  try {
    success(res, await service.markAsRead(req.params.id, req.user.id));
  } catch (e) { next(e); }
};

export const markAllRead = async (req, res, next) => {
  try {
    success(res, await service.markAllRead(req.user.id));
  } catch (e) { next(e); }
};

export const sendNotification = async (req, res, next) => {
  try {
    success(res, await service.sendNotification(req.body), "Notification sent");
  } catch (e) { next(e); }
};