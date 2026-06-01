import { getPool, sql } from "../config/db.js";
import { recordCouponUsage, earnPointsService, POINTS_PER_BOOKING } from "./coupon.service.js";
// import { getUserSubscriptionDiscountService } from "./Subscription.service.js";

/*
  SQL — run once in SSMS if columns are missing:

  ALTER TABLE payments ADD payment_gateway NVARCHAR(30) NOT NULL DEFAULT 'QR_UPI';
  ALTER TABLE payments ADD utr_number NVARCHAR(100) NULL;
  ALTER TABLE payments ADD payment_screenshot NVARCHAR(500) NULL;
  ALTER TABLE payments ADD payment_order_id NVARCHAR(255) NULL;
  ALTER TABLE payments ADD payment_id NVARCHAR(255) NULL;
  ALTER TABLE payments ADD verified_by BIGINT NULL;
  ALTER TABLE payments ADD verified_at DATETIME2 NULL;
  ALTER TABLE payments ADD rejection_reason NVARCHAR(500) NULL;
*/

/* ── Human-readable status labels sent to the frontend ─────────────────── */
const PAYMENT_STATUS_LABEL = {
  CREATED: "Pending Verification",
  SUCCESS: "Payment Confirmed ✓",
  FAILED:  "Payment Rejected",
};

const BOOKING_STATUS_LABEL = {
  PENDING:   "Awaiting Confirmation",
  CONFIRMED: "Booking Confirmed ✓",
  CANCELLED: "Booking Cancelled",
  COMPLETED: "Completed",
};

const formatPayment = (row) => ({
  ...row,
  payment_status_label: PAYMENT_STATUS_LABEL[row.payment_status] || row.payment_status,
  booking_status_label: BOOKING_STATUS_LABEL[row.booking_status] || row.booking_status,
});

/* ── GET QR CODE + AMOUNT FOR A CLASS ──────────────────────────────────── */
export const getQRDetailsService = async (classId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("class_id", sql.BigInt, parseInt(classId))
    .query(`
      SELECT
        c.id AS class_id, c.title, c.price, c.duration, c.mode, c.level,
        c.max_students,
        t.full_name AS trainer_name,
        t.qr_image_url AS trainer_qr_url,
        t.upi_id AS trainer_upi_id,
        i.name AS institute_name,
        cat.name AS category_name
      FROM classes c
      LEFT JOIN trainers t     ON c.trainer_id   = t.id
      LEFT JOIN institutes i   ON c.institute_id = i.id
      LEFT JOIN categories cat ON c.category_id  = cat.id
      WHERE c.id = @class_id AND c.is_active = 1 AND c.status = 'ACTIVE'
    `);

  if (result.recordset.length === 0) {
    throw new Error("Class not found or not available for booking");
  }

  const cls = result.recordset[0];

  // Prefer trainer's own QR, fall back to platform QR
  const qrImageUrl = cls.trainer_qr_url  || process.env.PAYMENT_QR_IMAGE_URL || null;
  const upiId      = cls.trainer_upi_id  || process.env.PAYMENT_UPI_ID       || null;
  const payeeName  = cls.trainer_name    || process.env.PAYMENT_PAYEE_NAME   || "FineArts Academy";

  return {
    class_id:  cls.class_id,
    title:     cls.title,
    amount:    cls.price,
    currency:  "INR",
    trainer:   cls.trainer_name,
    institute: cls.institute_name,
    category:  cls.category_name,
    mode:      cls.mode,
    duration:  `${cls.duration} mins`,
    payment_info: {
      qr_image_url: qrImageUrl,
      upi_id:       upiId,
      payee_name:   payeeName,
      note:         `FineArts - ${cls.title}`,
    },
    instructions: [
      "Step 1: Scan the QR code using GPay, PhonePe, Paytm or any UPI app",
      `Step 2: Pay exactly ₹${cls.price} — do not change the amount`,
      "Step 3: Save your UTR / Transaction ID shown after payment",
      "Step 4: Come back and submit your booking with that UTR number",
      "Step 5: We will verify and confirm your booking within 24 hours",
    ],
  };
};

/* ── SUBMIT PAYMENT (user submits UTR after paying via QR) ──────────────── */
export const submitPaymentService = async (accountId, body) => {
  const pool = getPool();

  const {
    class_id, trainer_id, institute_id,
    booking_type, amount, start_date, end_date,
    utr_number, payment_screenshot,
    coupon_id, discount_amount,
    points_redeemed, points_discount,
  } = body;

  // Input validation with clear messages
  if (!booking_type) {
    throw new Error("Please specify what you are booking: CLASS, TRAINER, or INSTITUTE");
  }
  if (!utr_number || !utr_number.trim()) {
    throw new Error("Please enter your UTR / Transaction ID from your UPI payment");
  }
  if (!amount || parseFloat(amount) <= 0) {
    throw new Error("Please enter a valid payment amount");
  }

  const cleanUTR = utr_number.trim().toUpperCase();

  // Duplicate UTR check
  const dupCheck = await pool.request()
    .input("utr_number", sql.NVarChar(100), cleanUTR)
    .query(`SELECT id FROM payments WHERE utr_number = @utr_number`);

  if (dupCheck.recordset.length > 0) {
    throw new Error(
      "This UTR number has already been used. If you paid again, please use the new UTR from your latest transaction."
    );
  }

  // Duplicate booking check
  if (class_id) {
    const existingBooking = await pool.request()
      .input("user_id",  sql.BigInt, accountId)
      .input("class_id", sql.BigInt, parseInt(class_id))
      .query(`
        SELECT id FROM bookings
        WHERE user_id = @user_id AND class_id = @class_id
          AND status IN ('PENDING', 'CONFIRMED')
      `);

    if (existingBooking.recordset.length > 0) {
      throw new Error(
        "You already have an active booking for this class. Check 'My Bookings' to see its status."
      );
    }
  }

  // Calculate final amount after discounts
  const originalAmount = parseFloat(amount);
  const couponDiscount = parseFloat(discount_amount || 0);
  const rewardDiscount = parseFloat(points_discount || 0);

  // Auto-apply subscription discount if user has active subscription
  const subscriptionDiscountPct = await getUserSubscriptionDiscountService(accountId);
  const subscriptionDiscount = subscriptionDiscountPct > 0
    ? parseFloat(((originalAmount - couponDiscount) * subscriptionDiscountPct / 100).toFixed(2))
    : 0;

  const finalAmount = Math.max(0, originalAmount - couponDiscount - rewardDiscount - subscriptionDiscount);

  // Create booking
  const bookingResult = await pool.request()
    .input("user_id",      sql.BigInt,        accountId)
    .input("class_id",     sql.BigInt,        class_id     ? parseInt(class_id)     : null)
    .input("trainer_id",   sql.BigInt,        trainer_id   ? parseInt(trainer_id)   : null)
    .input("institute_id", sql.BigInt,        institute_id ? parseInt(institute_id) : null)
    .input("booking_type", sql.NVarChar(20),  booking_type)
    .input("amount",       sql.Decimal(10,2), finalAmount)
    .input("start_date",   sql.Date,          start_date ? new Date(start_date) : null)
    .input("end_date",     sql.Date,          end_date   ? new Date(end_date)   : null)
    .query(`
      INSERT INTO bookings
        (user_id, class_id, trainer_id, institute_id, booking_type,
         status, amount, payment_status, start_date, end_date)
      OUTPUT INSERTED.*
      VALUES
        (@user_id, @class_id, @trainer_id, @institute_id, @booking_type,
         'PENDING', @amount, 'PENDING', @start_date, @end_date)
    `);

  const booking = bookingResult.recordset[0];

  // Create payment record
  const paymentResult = await pool.request()
    .input("booking_id",         sql.BigInt,        booking.id)
    .input("user_id",            sql.BigInt,        accountId)
    .input("amount",             sql.Decimal(10,2), finalAmount)
    .input("utr_number",         sql.NVarChar(100), cleanUTR)
    .input("payment_screenshot", sql.NVarChar(500), payment_screenshot || null)
    .query(`
      INSERT INTO payments
        (booking_id, user_id, payment_gateway, amount, currency,
         status, utr_number, payment_screenshot)
      OUTPUT INSERTED.*
      VALUES
        (@booking_id, @user_id, 'QR_UPI', @amount, 'INR',
         'CREATED', @utr_number, @payment_screenshot)
    `);

  // Record coupon usage
  if (coupon_id && couponDiscount > 0) {
    await recordCouponUsage(pool, coupon_id, accountId, booking.id, couponDiscount);
  }

  return {
    booking_id:                  booking.id,
    payment_id:                  paymentResult.recordset[0].id,
    status:                      "PENDING",
    status_label:                "Pending Verification",
    original_amount:             originalAmount,
    coupon_discount:             couponDiscount,
    subscription_discount:       subscriptionDiscount,
    subscription_discount_pct:   subscriptionDiscountPct,
    reward_discount:             rewardDiscount,
    amount_paid:                 finalAmount,
    utr_number:                  cleanUTR,
    message:                     "Your payment has been submitted successfully! We will verify your UTR and confirm your booking within 24 hours. You will be notified once confirmed.",
    next_steps:                  [
      "Keep your UTR number safe for reference",
      "Check 'My Bookings' to track your booking status",
      "Contact support if not confirmed within 24 hours",
    ],
  };
};

/* ── GET PENDING PAYMENTS (admin / institute) ───────────────────────────── */
export const getPendingPaymentsService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT
      p.id AS payment_id,
      p.amount,
      p.utr_number,
      p.payment_screenshot,
      p.status AS payment_status,
      p.created_at AS submitted_at,
      b.id AS booking_id,
      b.booking_type,
      b.status AS booking_status,
      b.start_date,
      b.end_date,
      a.phone_number AS user_phone,
      a.email AS user_email,
      c.title AS class_title,
      c.price AS class_price,
      t.full_name AS trainer_name,
      i.name AS institute_name
    FROM payments p
    JOIN bookings b      ON p.booking_id   = b.id
    JOIN accounts a      ON p.user_id      = a.id
    LEFT JOIN classes c    ON b.class_id   = c.id
    LEFT JOIN trainers t   ON b.trainer_id = t.id
    LEFT JOIN institutes i ON b.institute_id = i.id
    WHERE p.status = 'CREATED'
    ORDER BY p.created_at ASC
  `);

  return result.recordset.map(formatPayment);
};

/* ── VERIFY PAYMENT → CONFIRM BOOKING ──────────────────────────────────── */
export const verifyPaymentService = async (adminAccountId, paymentId) => {
  const pool = getPool();

  const paymentCheck = await pool.request()
    .input("id", sql.BigInt, parseInt(paymentId))
    .query(`SELECT * FROM payments WHERE id = @id`);

  if (paymentCheck.recordset.length === 0) {
    throw new Error("Payment record not found");
  }

  const payment = paymentCheck.recordset[0];

  if (payment.status === "SUCCESS") {
    throw new Error("This payment has already been verified");
  }
  if (payment.status === "FAILED") {
    throw new Error("This payment was already rejected. Cannot verify a rejected payment.");
  }

  // Mark payment verified
  await pool.request()
    .input("id",          sql.BigInt, parseInt(paymentId))
    .input("verified_by", sql.BigInt, adminAccountId)
    .query(`
      UPDATE payments SET
        status       = 'SUCCESS',
        payment_date = SYSDATETIME(),
        verified_by  = @verified_by,
        verified_at  = SYSDATETIME()
      WHERE id = @id
    `);

  // Confirm booking
  await pool.request()
    .input("booking_id", sql.BigInt, payment.booking_id)
    .query(`
      UPDATE bookings SET
        status         = 'CONFIRMED',
        payment_status = 'PAID',
        updated_at     = SYSDATETIME()
      WHERE id = @booking_id
    `);

  // Award reward points (non-critical)
  try {
    await earnPointsService(
      pool,
      payment.user_id,
      POINTS_PER_BOOKING,
      "EARNED",
      `Earned ${POINTS_PER_BOOKING} points for confirmed booking`,
      payment.booking_id
    );
  } catch (_) { /* silent — points are a bonus, not critical */ }

  return {
    payment_id:   parseInt(paymentId),
    booking_id:   payment.booking_id,
    status:       "SUCCESS",
    status_label: "Payment Confirmed ✓",
    message:      "Payment verified successfully. The user's booking is now confirmed and they have been notified.",
  };
};

/* ── REJECT PAYMENT ─────────────────────────────────────────────────────── */
export const rejectPaymentService = async (adminAccountId, paymentId, reason) => {
  const pool = getPool();

  if (!reason || !reason.trim()) {
    throw new Error("Please provide a reason for rejection so the user knows what went wrong");
  }

  const paymentCheck = await pool.request()
    .input("id", sql.BigInt, parseInt(paymentId))
    .query(`SELECT * FROM payments WHERE id = @id`);

  if (paymentCheck.recordset.length === 0) {
    throw new Error("Payment record not found");
  }

  const payment = paymentCheck.recordset[0];

  if (payment.status === "SUCCESS") {
    throw new Error("This payment has already been verified. Cannot reject a verified payment.");
  }
  if (payment.status === "FAILED") {
    throw new Error("This payment has already been rejected");
  }

  await pool.request()
    .input("id",               sql.BigInt,        parseInt(paymentId))
    .input("verified_by",      sql.BigInt,        adminAccountId)
    .input("rejection_reason", sql.NVarChar(500), reason.trim())
    .query(`
      UPDATE payments SET
        status           = 'FAILED',
        verified_by      = @verified_by,
        verified_at      = SYSDATETIME(),
        rejection_reason = @rejection_reason
      WHERE id = @id
    `);

  // Cancel booking
  await pool.request()
    .input("booking_id", sql.BigInt, payment.booking_id)
    .query(`
      UPDATE bookings SET
        status         = 'CANCELLED',
        payment_status = 'FAILED',
        updated_at     = SYSDATETIME()
      WHERE id = @booking_id
    `);

  return {
    payment_id:       parseInt(paymentId),
    booking_id:       payment.booking_id,
    status:           "FAILED",
    status_label:     "Payment Rejected",
    rejection_reason: reason.trim(),
    message:          "Payment rejected. The user's booking has been cancelled and they will be notified with the reason.",
  };
};

/* ── GET MY PAYMENTS (user) ─────────────────────────────────────────────── */
export const getMyPaymentsService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT
        p.id AS payment_id,
        p.amount,
        p.utr_number,
        p.status AS payment_status,
        p.created_at AS submitted_at,
        p.verified_at,
        p.rejection_reason,
        b.id AS booking_id,
        b.booking_type,
        b.status AS booking_status,
        b.start_date,
        b.end_date,
        c.title AS class_title,
        c.mode AS class_mode,
        t.full_name AS trainer_name,
        i.name AS institute_name
      FROM payments p
      JOIN bookings b      ON p.booking_id   = b.id
      LEFT JOIN classes c    ON b.class_id   = c.id
      LEFT JOIN trainers t   ON b.trainer_id = t.id
      LEFT JOIN institutes i ON b.institute_id = i.id
      WHERE p.user_id = @user_id
      ORDER BY p.created_at DESC
    `);

  return result.recordset.map(formatPayment);
};

/* ── GET QR SETTINGS ────────────────────────────────────────────────────── */
export const getQRSettingsService = async () => {
  return {
    qr_image_url: process.env.PAYMENT_QR_IMAGE_URL || null,
    upi_id:       process.env.PAYMENT_UPI_ID       || null,
    payee_name:   process.env.PAYMENT_PAYEE_NAME   || "FineArts Academy",
  };
};
