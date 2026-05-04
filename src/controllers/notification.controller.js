import {
  getMyNotifications,
  markAsRead as markAsReadService,
  markAllRead,
  sendNotification as sendNotificationService,
} from "../services/notification.service.js";

const ok   = (res, data, msg = "Success") => res.json({ success: true, message: msg, data });
const fail = (res, e, status = 400) => res.status(status).json({ success: false, message: e.message });

export const getMyNotificationsHandler = async (req, res) => {
  try {
    const data = await getMyNotifications(req.account.id);
    ok(res, data, `${data.length} notification(s)`);
  } catch (e) { fail(res, e, 500); }
};

export const markAsReadHandler = async (req, res) => {
  try {
    const data = await markAsReadService(req.params.id, req.account.id);
    ok(res, data, "Notification marked as read");
  } catch (e) { fail(res, e); }
};

export const markAllAsReadHandler = async (req, res) => {
  try {
    const data = await markAllRead(req.account.id);
    ok(res, data, "All notifications marked as read");
  } catch (e) { fail(res, e, 500); }
};

export const sendNotificationHandler = async (req, res) => {
  try {
    const { title, message, target_account_id, type } = req.body;
    if (!title || !message || !target_account_id) {
      return res.status(400).json({ success: false, message: "title, message, and target_account_id are required" });
    }
    const data = await sendNotificationService({ user_id: target_account_id, title, message, type });
    ok(res, data, "Notification sent");
  } catch (e) { fail(res, e, 500); }
};
