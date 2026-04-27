export const createPaymentOrder = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment order created successfully",
    data: {
      booking_id: req.body.booking_id,
      amount: req.body.amount,
      status: "CREATED"
    }
  });
};

export const verifyPayment = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    data: req.body
  });
};

export const savePayment = async (req, res) => {
  return res.status(201).json({
    success: true,
    message: "Payment saved successfully",
    data: req.body
  });
};

export const getMyPayments = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "My payments fetched successfully",
    data: []
  });
};

export const getPaymentByBookingId = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Payment by booking fetched successfully",
    data: {
      booking_id: req.params.bookingId
    }
  });
};

export const refundPayment = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Refund processed successfully",
    data: {
      payment_id: req.params.id
    }
  });
};

export const paymentWebhook = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Webhook received successfully"
  });
};