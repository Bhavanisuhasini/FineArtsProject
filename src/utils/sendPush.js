import admin from "../config/firebase.js";
import { getPool, sql } from "../config/db.js";

/**
 * Send a push notification to a single FCM token directly.
 * @param {string} fcmToken - Device FCM token
 * @param {string} title
 * @param {string} body
 */
export const sendPushNotification = async (fcmToken, title, body) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
    });
  } catch (err) {
    // Fire-and-forget: log but don't throw
    console.error("sendPushNotification error:", err.message);
  }
};

/**
 * Send a push notification to all FCM tokens registered for a user_id.
 * @param {number} user_id
 * @param {string} title
 * @param {string} body
 */
export const sendPushToUser = async (user_id, title, body) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`SELECT fcm_token FROM user_devices WHERE user_id = @user_id AND fcm_token IS NOT NULL`);

    const tokens = result.recordset.map((r) => r.fcm_token).filter(Boolean);
    if (tokens.length === 0) return;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
  } catch (err) {
    console.error("sendPushToUser error:", err.message);
  }
};
