import { getPool, sql } from "../config/db.js";
import { sendPushNotification } from "../utils/sendPush.js";

import { sendPushNotification } from "../utils/sendPush.js";
// ✅ CREATE BOOKING + notify trainer
export const createBookingHandler = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { class_id, trainer_id, institute_id, booking_type, start_date, end_date, amount, slot } = req.body;

    if (!class_id || !amount) {
      return res.status(400).json({ success: false, message: "class_id and amount are required" });
    }

    const pool = getPool();

    // Insert booking
    const result = await pool.request()
      .input("user_id",        sql.BigInt,   user_id)
      .input("class_id",       sql.BigInt,   class_id)
      .input("trainer_id",     sql.BigInt,   trainer_id )
      .input("institute_id",   sql.BigInt,   institute_id)
      .input("booking_type",   sql.NVarChar, booking_type  || "CLASS")
      .input("status",         sql.NVarChar, "CONFIRMED")
      .input("amount",         sql.Decimal,  amount)
      .input("payment_status", sql.NVarChar, "PENDING")
      .input("start_date",     sql.Date,     start_date ? new Date(start_date) : new Date())
      .input("end_date",       sql.Date,     end_date   ? new Date(end_date)   : new Date())
      .query(`
        INSERT INTO bookings
          (user_id, class_id, trainer_id, institute_id, booking_type,
           status, amount, payment_status, start_date, end_date, created_at, updated_at)
        OUTPUT INSERTED.*
        VALUES
          (@user_id, @class_id, @trainer_id, @institute_id, @booking_type,
           @status, @amount, @payment_status, @start_date, @end_date,
           SYSDATETIME(), SYSDATETIME())
      `);

    const booking = result.recordset[0];
// ✅ SEND PUSH TO TRAINER
if (trainer_id) {
  const trainerTokenRes = await pool.request()
    .input("trainer_id", sql.BigInt, trainer_id)
    .query(`
      SELECT u.fcm_token 
      FROM users u
      JOIN trainers t ON t.account_id = u.id
      WHERE t.id = @trainer_id
    `);

  const fcmToken = trainerTokenRes.recordset[0]?.fcm_token;

  if (fcmToken) {
    await sendPushNotification(
      fcmToken,
      "New Booking 🎉",
      "A student booked your class"
    );
  }
}
    // Notify trainer
    if (trainer_id) {
      const trainerAcc = await pool.request()
        .input("trainer_id", sql.BigInt, trainer_id)
        .query(`SELECT account_id FROM trainers WHERE id = @trainer_id`);

      const trainerAccountId = trainerAcc.recordset[0]?.account_id;
      if (trainerAccountId) {
        await pool.request()
          .input("user_id",  sql.BigInt,   trainerAccountId)
          .input("title",    sql.NVarChar, "New Booking Received! 🎉")
          .input("message",  sql.NVarChar, "A student has booked your class. Please create a session with Zoom link and schedule.")
          .input("body",     sql.NVarChar, JSON.stringify({ booking_id: booking.id, class_id }))
          .input("type",     sql.NVarChar, "BOOKING")
          .query(`
            INSERT INTO notifications (user_id, title, message, body, type, is_read, created_at)
            VALUES (@user_id, @title, @message, @body, @type, 0, SYSDATETIME())
          `);

        // ✅ Fire-and-forget: push notification to trainer's FCM token
        const fcmRes = await pool.request()
          .input("user_id", sql.BigInt, trainerAccountId)
          .query(`SELECT fcm_token FROM accounts WHERE id = @user_id`);
        const fcmToken = fcmRes.recordset[0]?.fcm_token;
        if (fcmToken) {
          sendPushNotification(fcmToken, "New Booking Received! 🎉", "A student has booked your class.");
        }
      }
    }

    res.status(201).json({ success: true, message: "Booking created successfully", data: booking });
  } catch (err) {
    console.error("createBookingHandler:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ GET USER'S BOOKINGS — joins class_sessions (correct table name)
export const getUserBookingsHandler = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ success: false, message: "Unauthorized" });

    const pool = getPool();

    const result = await pool.request()
      .input("user_id", sql.BigInt, user_id)
      .query(`
        SELECT
          b.id,
          b.status,
          b.amount,
          b.payment_status,
          b.start_date,
          b.end_date,
          b.created_at,
          b.booking_type,

          c.title         AS class_title,
          c.level         AS class_level,
          c.mode          AS class_mode,
          c.image         AS class_image,

          t.full_name     AS trainer_name,
          t.profile_image AS trainer_image,

          cs.id           AS session_id,
          cs.session_date,
          cs.start_time,
          cs.end_time,
          cs.zoom_link,
          cs.zoom_meeting_id

        FROM bookings b
        LEFT JOIN classes       c  ON c.id  = b.class_id
        LEFT JOIN trainers      t  ON t.id  = b.trainer_id
        LEFT JOIN class_sessions cs ON cs.class_id = b.class_id
                                   AND cs.session_date >= CAST(GETDATE() AS DATE)
        WHERE b.user_id = @user_id
        ORDER BY b.created_at DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("getUserBookingsHandler:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ GET SINGLE BOOKING
export const getBookingByIdHandler = async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input("id", sql.BigInt, req.params.id)
      .query(`SELECT * FROM bookings WHERE id = @id`);

    if (!result.recordset[0])
      return res.status(404).json({ success: false, message: "Booking not found" });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ UPDATE BOOKING STATUS + update payments table
export const updateStatusHandler = async (req, res) => {
  try {
    const { status, payment_status, payment_id, payment_gateway, payment_order_id, amount } = req.body;
    const pool = getPool();

    await pool.request()
      .input("id",             sql.BigInt,   req.params.id)
      .input("status",         sql.NVarChar, status         || "CONFIRMED")
      .input("payment_status", sql.NVarChar, payment_status || "PAID")
      .query(`
        UPDATE bookings
        SET status = @status, payment_status = @payment_status, updated_at = SYSDATETIME()
        WHERE id = @id
      `);
      // ✅ SEND PUSH TO USER AFTER STATUS UPDATE
const bookingRes = await pool.request()
  .input("id", sql.BigInt, req.params.id)
  .query(`SELECT user_id, status FROM bookings WHERE id = @id`);

const bookingData = bookingRes.recordset[0];

if (bookingData) {
  const userTokenRes = await pool.request()
    .input("user_id", sql.BigInt, bookingData.user_id)
    .query(`SELECT fcm_token FROM users WHERE id = @user_id`);

  const fcmToken = userTokenRes.recordset[0]?.fcm_token;

  if (fcmToken) {
    await sendPushNotification(
      fcmToken,
      "Booking Update 📢",
      `Your booking is now ${bookingData.status}`
    );
  }
}

    // Save to payments table if payment info given
    if (payment_id) {
      const booking = await pool.request()
        .input("id", sql.BigInt, req.params.id)
        .query(`SELECT user_id, amount FROM bookings WHERE id = @id`);

      const b = booking.recordset[0];
      if (b) {
        await pool.request()
          .input("booking_id",       sql.BigInt,   req.params.id)
          .input("user_id",          sql.BigInt,   b.user_id)
          .input("payment_gateway",  sql.NVarChar, payment_gateway  || "RAZORPAY")
          .input("payment_order_id", sql.NVarChar, payment_order_id || null)
          .input("payment_id",       sql.NVarChar, payment_id)
          .input("amount",           sql.Decimal,  amount || b.amount)
          .input("currency",         sql.NVarChar, "INR")
          .input("status",           sql.NVarChar, "SUCCESS")
          .query(`
            INSERT INTO payments
              (booking_id, user_id, payment_gateway, payment_order_id, payment_id, amount, currency, status)
            VALUES
              (@booking_id, @user_id, @payment_gateway, @payment_order_id, @payment_id, @amount, @currency, @status)
          `);
      }
    }

    res.json({ success: true, message: "Booking updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// ✅ CHECK ELIGIBILITY
export const checkEligibilityHandler = async (req, res) => {
  try {
    const user_id  = req.user?.id;
    const { class_id } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input("user_id",  sql.BigInt, user_id)
      .input("class_id", sql.BigInt, class_id)
      .query(`
        SELECT COUNT(*) AS cnt FROM bookings
        WHERE user_id = @user_id AND class_id = @class_id AND status != 'CANCELLED'
      `);

    res.json({ success: true, eligible: result.recordset[0].cnt === 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};