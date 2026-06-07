import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import firebaseAuth from "../middlewares/firebaseAuth.js";
import { getPool, sql } from "../config/db.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ STEP 1: Create Razorpay Order
router.post("/create-order", firebaseAuth, async (req, res) => {
  try {
    const { amount, booking_id, class_id } = req.body;

    if (!amount)
      return res.status(400).json({ success: false, message: "amount is required" });

    const options = {
      amount:   Math.round(amount * 100), // paise
      currency: "INR",
      receipt:  `receipt_${booking_id || Date.now()}`,
      notes: {
        booking_id: booking_id || "",
        class_id:   class_id   || "",
        user_id:    req.user?.id || "",
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success:   true,
      order_id:  order.id,
      amount:    order.amount,
      currency:  order.currency,
      key_id:    process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ STEP 2: Verify Payment + save to payments table + update booking
router.post("/verify", firebaseAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ success: false, message: "Missing payment fields" });

    // Verify HMAC signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ success: false, message: "Payment verification failed ❌" });

    const pool = getPool();
    const user_id = req.user?.id;

    // 1. Update booking status to PAID
    if (booking_id) {
      await pool.request()
        .input("id",             sql.BigInt,   booking_id)
        .input("payment_status", sql.NVarChar, "PAID")
        .input("status",         sql.NVarChar, "CONFIRMED")
        .query(`
          UPDATE bookings
          SET payment_status = @payment_status,
              status         = @status,
              updated_at     = SYSDATETIME()
          WHERE id = @id
        `);
    }

    // 2. Save to payments table
    await pool.request()
      .input("booking_id",       sql.BigInt,   booking_id    || null)
      .input("user_id",          sql.BigInt,   user_id)
      .input("payment_gateway",  sql.NVarChar, "RAZORPAY")
      .input("payment_order_id", sql.NVarChar, razorpay_order_id)
      .input("payment_id",       sql.NVarChar, razorpay_payment_id)
      .input("amount",           sql.Decimal,  amount        || 0)
      .input("currency",         sql.NVarChar, "INR")
      .input("status",           sql.NVarChar, "SUCCESS")
      .query(`
        INSERT INTO payments
          (booking_id, user_id, payment_gateway, payment_order_id, payment_id, amount, currency, status)
        VALUES
          (@booking_id, @user_id, @payment_gateway, @payment_order_id, @payment_id, @amount, @currency, @status)
      `);

    res.json({
      success:    true,
      message:    "Payment verified ✅",
      payment_id: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
