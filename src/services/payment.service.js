import { getPool, sql } from "../config/db.js";

/*
  QR Payment Flow:
  1. User views class → sees QR code image + amount
  2. User scans QR, pays via UPI app
  3. User submits payment with UTR/transaction reference
  4. Admin/Institute verifies and confirms the payment
  5. Booking status changes to CONFIRMED → user gets access

  SQL to add to payments table (run in SSMS if columns missing):
  ALTER TABLE payments ADD payment_gateway NVARCHAR(30) NOT NULL DEFAULT 'QR_UPI';
  ALTER TABLE payments ADD utr_number NVARCHAR(100) NULL;
  ALTER TABLE payments ADD payment_screenshot NVARCHAR(500) NULL;
  ALTER TABLE payments ADD payment_order_id NVARCHAR(255) NULL;
  ALTER TABLE payments ADD payment_id NVARCHAR(255) NULL;
  ALTER TABLE payments ADD verified_by BIGINT NULL;
  ALTER TABLE payments ADD verified_at DATETIME2 NULL;
  ALTER TABLE payments ADD rejection_reason NVARCHAR(500) NULL;
*/

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
        i.name AS institute_name,
        cat.name AS category_name
      FROM classes c
      LEFT JOIN trainers t    ON c.trainer_id    = t.id
      LEFT JOIN institutes i  ON c.institute_id  = i.id
      LEFT JOIN categories cat ON c.category_id  = cat.id
      WHERE c.id = @class_id AND c.is_active = 1 AND c.status = 'ACTIVE'
    `);

  if (result.recordset.length === 0) throw new Error("Class not found or not available");

  const classData = result.recordset[0];

  // Get QR code from settings table or use env variable
  // For now return the QR image URL from environment or a default
  const qrImageUrl = process.env.PAYMENT_QR_IMAGE_URL || null;
  const upiId      = process.env.PAYMENT_UPI_ID       || null;
  const payeeName  = process.env.PAYMENT_PAYEE_NAME   || "FineArts";

  return {
    class_id:    classData.class_id,
    title:       classData.title,
    amount:      classData.price,
    currency:    "INR",
    trainer:     classData.trainer_name,
    institute:   classData.institute_name,
    category:    classData.category_name,
    payment_info: {
      qr_image_url: qrImageUrl,
      upi_id:       upiId,
      payee_name:   payeeName,
      note:         `Payment for ${classData.title}`,
    },
    instructions: [
      "1. Scan the QR code using any UPI app (GPay, PhonePe, Paytm etc.)",
      `2. Pay exactly ₹${classData.price}`,
      "3. Note your UTR/Transaction ID after payment",
      "4. Submit your booking with the UTR number",
      "5. Your booking will be confirmed within 24 hours after verification",
    ],
  };
};

/* ── SUBMIT PAYMENT (user submits UTR after paying) ─────────────────────── */
export const submitPaymentService = async (accountId, body) => {
  const pool = getPool();

  const {
    class_id, trainer_id, institute_id,
    booking_type, amount, start_date, end_date,
    utr_number, payment_screenshot,
  } = body;

  if (!booking_type) throw new Error("booking_type is required (CLASS, TRAINER, INSTITUTE)");
  if (!utr_number)   throw new Error("utr_number is required");
  if (!amount)       throw new Error("amount is required");

  // Check for duplicate UTR
  const dupCheck = await pool.request()
    .input("utr_number", sql.NVarChar(100), utr_number)
    .query(`SELECT id FROM payments WHERE utr_number = @utr_number`);
  if (dupCheck.recordset.length > 0) throw new Error("This UTR number has already been submitted");

  // Check if user already has active booking for this class
  if (class_id) {
    const existingBooking = await pool.request()
      .input("user_id",  sql.BigInt, accountId)
      .input("class_id", sql.BigInt, parseInt(class_id))
      .query(`
        SELECT id FROM bookings
        WHERE user_id = @user_id AND class_id = @class_id
          AND status IN ('PENDING','CONFIRMED')
      `);
    if (existingBooking.recordset.length > 0) throw new Error("You already have an active booking for this class");
  }

  // 1. Create booking with PENDING status
  const bookingResult = await pool.request()
    .input("user_id",      sql.BigInt,       accountId)
    .input("class_id",     sql.BigInt,       class_id    ? parseInt(class_id)     : null)
    .input("trainer_id",   sql.BigInt,       trainer_id  ? parseInt(trainer_id)   : null)
    .input("institute_id", sql.BigInt,       institute_id? parseInt(institute_id) : null)
    .input("booking_type", sql.NVarChar(20), booking_type)
    .input("amount",       sql.Decimal(10,2),parseFloat(amount))
    .input("start_date",   sql.Date,         start_date ? new Date(start_date) : null)
    .input("end_date",     sql.Date,         end_date   ? new Date(end_date)   : null)
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

  // 2. Create payment record with PENDING status (waiting for admin verification)
  const paymentResult = await pool.request()
    .input("booking_id",         sql.BigInt,       booking.id)
    .input("user_id",            sql.BigInt,       accountId)
    .input("amount",             sql.Decimal(10,2),parseFloat(amount))
    .input("utr_number",         sql.NVarChar(100),utr_number.trim())
    .input("payment_screenshot", sql.NVarChar(500),payment_screenshot || null)
    .query(`
      INSERT INTO payments
        (booking_id, user_id, payment_gateway, amount, currency, status, utr_number, payment_screenshot)
      OUTPUT INSERTED.*
      VALUES
        (@booking_id, @user_id, 'QR_UPI', @amount, 'INR', 'CREATED', @utr_number, @payment_screenshot)
    `);

  return {
    booking:  booking,
    payment:  paymentResult.recordset[0],
    message:  "Payment submitted successfully. Your booking will be confirmed within 24 hours after verification.",
  };
};

/* ── ADMIN/INSTITUTE: GET PENDING PAYMENTS ──────────────────────────────── */
export const getPendingPaymentsService = async () => {
  const pool = getPool();

  const result = await pool.request().query(`
    SELECT
      p.id AS payment_id, p.amount, p.utr_number, p.payment_screenshot,
      p.status AS payment_status, p.created_at AS submitted_at,
      b.id AS booking_id, b.booking_type, b.status AS booking_status,
      b.start_date, b.end_date,
      a.phone_number AS user_phone,
      c.title AS class_title, c.price AS class_price,
      t.full_name AS trainer_name,
      i.name AS institute_name
    FROM payments p
    JOIN bookings b  ON p.booking_id  = b.id
    JOIN accounts a  ON p.user_id     = a.id
    LEFT JOIN classes    c ON b.class_id    = c.id
    LEFT JOIN trainers   t ON b.trainer_id  = t.id
    LEFT JOIN institutes i ON b.institute_id= i.id
    WHERE p.status = 'CREATED'
    ORDER BY p.created_at DESC
  `);

  return result.recordset;
};

/* ── ADMIN/INSTITUTE: VERIFY PAYMENT → CONFIRM BOOKING ─────────────────── */
export const verifyPaymentService = async (adminAccountId, paymentId) => {
  const pool = getPool();

  const paymentCheck = await pool.request()
    .input("id", sql.BigInt, parseInt(paymentId))
    .query(`SELECT * FROM payments WHERE id = @id`);

  if (paymentCheck.recordset.length === 0) throw new Error("Payment not found");
  const payment = paymentCheck.recordset[0];
  if (payment.status !== "CREATED") throw new Error("Payment already processed");

  // Mark payment as SUCCESS
  await pool.request()
    .input("id",          sql.BigInt,   parseInt(paymentId))
    .input("verified_by", sql.BigInt,   adminAccountId)
    .query(`
      UPDATE payments SET
        status       = 'SUCCESS',
        payment_date = SYSDATETIME(),
        verified_by  = @verified_by,
        verified_at  = SYSDATETIME()
      WHERE id = @id
    `);

  // Confirm the booking
  await pool.request()
    .input("booking_id", sql.BigInt, payment.booking_id)
    .query(`
      UPDATE bookings SET
        status         = 'CONFIRMED',
        payment_status = 'PAID',
        updated_at     = SYSDATETIME()
      WHERE id = @booking_id
    `);

  return {
    payment_id:  parseInt(paymentId),
    booking_id:  payment.booking_id,
    status:      "SUCCESS",
    message:     "Payment verified. Booking confirmed. User now has access.",
  };
};

/* ── ADMIN/INSTITUTE: REJECT PAYMENT ────────────────────────────────────── */
export const rejectPaymentService = async (adminAccountId, paymentId, reason) => {
  const pool = getPool();

  if (!reason) throw new Error("Rejection reason is required");

  const paymentCheck = await pool.request()
    .input("id", sql.BigInt, parseInt(paymentId))
    .query(`SELECT * FROM payments WHERE id = @id`);

  if (paymentCheck.recordset.length === 0) throw new Error("Payment not found");
  const payment = paymentCheck.recordset[0];
  if (payment.status !== "CREATED") throw new Error("Payment already processed");

  await pool.request()
    .input("id",               sql.BigInt,       parseInt(paymentId))
    .input("verified_by",      sql.BigInt,       adminAccountId)
    .input("rejection_reason", sql.NVarChar(500),reason)
    .query(`
      UPDATE payments SET
        status           = 'FAILED',
        verified_by      = @verified_by,
        verified_at      = SYSDATETIME(),
        rejection_reason = @rejection_reason
      WHERE id = @id
    `);

  // Cancel the booking
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
    payment_id: parseInt(paymentId),
    booking_id: payment.booking_id,
    status:     "FAILED",
    message:    "Payment rejected. Booking cancelled.",
  };
};

/* ── GET MY PAYMENTS (user) ─────────────────────────────────────────────── */
export const getMyPaymentsService = async (accountId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.BigInt, accountId)
    .query(`
      SELECT
        p.id AS payment_id, p.amount, p.utr_number,
        p.status AS payment_status, p.created_at, p.verified_at,
        p.rejection_reason,
        b.id AS booking_id, b.booking_type, b.status AS booking_status,
        b.start_date, b.end_date,
        c.title AS class_title,
        t.full_name AS trainer_name,
        i.name AS institute_name
      FROM payments p
      JOIN bookings b  ON p.booking_id  = b.id
      LEFT JOIN classes    c ON b.class_id    = c.id
      LEFT JOIN trainers   t ON b.trainer_id  = t.id
      LEFT JOIN institutes i ON b.institute_id= i.id
      WHERE p.user_id = @user_id
      ORDER BY p.created_at DESC
    `);

  return result.recordset;
};

/* ── GET QR SETTINGS (admin manages QR image) ───────────────────────────── */
export const getQRSettingsService = async () => {
  return {
    qr_image_url: process.env.PAYMENT_QR_IMAGE_URL || null,
    upi_id:       process.env.PAYMENT_UPI_ID       || null,
    payee_name:   process.env.PAYMENT_PAYEE_NAME   || "FineArts",
  };
};