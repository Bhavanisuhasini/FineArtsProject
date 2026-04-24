import { getPool, sql } from "../config/db.js";
import crypto from "crypto";

/**
 * 1. CREATE ORDER
 * (simulate payment gateway order)
 */
export const createOrder = async (userId, { booking_id, amount }) => {
  const pool = getPool();

  const orderId = "ORD_" + Date.now();

  const result = await pool.request()
    .input("booking_id", sql.Int, booking_id)
    .input("user_id", sql.Int, userId)
    .input("order_id", sql.NVarChar, orderId)
    .input("amount", sql.Decimal(10,2), amount)
    .query(`
      INSERT INTO payments (booking_id, user_id, order_id, amount)
      OUTPUT INSERTED.*
      VALUES (@booking_id, @user_id, @order_id, @amount)
    `);

  return result.recordset[0];
};

/**
 * 2. VERIFY PAYMENT
 */
export const verifyPayment = async ({ order_id, payment_id, signature }) => {
  // Example verification (mock)
  const expected = crypto
    .createHash("sha256")
    .update(order_id + "|" + payment_id)
    .digest("hex");

  if (expected !== signature) {
    throw new Error("Invalid payment signature");
  }

  const pool = getPool();

  await pool.request()
    .input("order_id", sql.NVarChar, order_id)
    .input("payment_id", sql.NVarChar, payment_id)
    .query(`
      UPDATE payments
      SET payment_id=@payment_id, status='PAID', updated_at=GETDATE()
      WHERE order_id=@order_id
    `);

  return { status: "PAID" };
};

/**
 * 3. SAVE PAYMENT (manual entry if needed)
 */
export const savePayment = async (userId, body) => {
  const pool = getPool();

  const result = await pool.request()
    .input("booking_id", sql.Int, body.booking_id)
    .input("user_id", sql.Int, userId)
    .input("payment_id", sql.NVarChar, body.payment_id)
    .input("amount", sql.Decimal(10,2), body.amount)
    .input("status", sql.NVarChar, "PAID")
    .query(`
      INSERT INTO payments (booking_id, user_id, payment_id, amount, status)
      OUTPUT INSERTED.*
      VALUES (@booking_id, @user_id, @payment_id, @amount, @status)
    `);

  return result.recordset[0];
};

/**
 * 4. GET BY BOOKING
 */
export const getByBooking = async (bookingId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("booking_id", sql.Int, bookingId)
    .query(`SELECT * FROM payments WHERE booking_id=@booking_id`);

  return result.recordset;
};

/**
 * 5. GET MY PAYMENTS
 */
export const getMyPayments = async (userId) => {
  const pool = getPool();

  const result = await pool.request()
    .input("user_id", sql.Int, userId)
    .query(`SELECT * FROM payments WHERE user_id=@user_id`);

  return result.recordset;
};

/**
 * 6. REFUND
 */
export const refundPayment = async (id) => {
  const pool = getPool();

  const refundId = "REF_" + Date.now();

  await pool.request()
    .input("id", sql.Int, id)
    .input("refund_id", sql.NVarChar, refundId)
    .query(`
      UPDATE payments
      SET status='REFUNDED', refund_id=@refund_id
      WHERE id=@id
    `);

  return { id, refund_id: refundId, status: "REFUNDED" };
};

/**
 * 7. WEBHOOK
 */
export const webhookHandler = async (body) => {
  const pool = getPool();

  // Example webhook payload
  const { order_id, payment_id, status } = body;

  await pool.request()
    .input("order_id", sql.NVarChar, order_id)
    .input("payment_id", sql.NVarChar, payment_id)
    .input("status", sql.NVarChar, status)
    .query(`
      UPDATE payments
      SET payment_id=@payment_id, status=@status
      WHERE order_id=@order_id
    `);

  return { received: true };
};