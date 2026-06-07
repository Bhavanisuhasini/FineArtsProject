import crypto from "crypto";
import { razorpay } from "../utils/razorpay.js";
import sql from "mssql";

// ✅ CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { amount, booking_id } = req.body;

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_${booking_id}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
};

// ✅ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
    } = req.body;

    // 🔥 CRITICAL LINE
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // ✅ UPDATE BOOKING STATUS
    await sql.query`
      UPDATE bookings
      SET payment_status = 'PAID',
          payment_id = ${razorpay_payment_id},
          order_id = ${razorpay_order_id}
      WHERE id = ${booking_id}
    `;

    res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};