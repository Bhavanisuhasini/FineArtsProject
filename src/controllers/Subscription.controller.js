import {
  listPlansService,
  getPlanByIdService,
  createPlanService,
  updatePlanService,
  subscribeToPlanService,
  getMySubscriptionService,
  cancelSubscriptionService,
  getUserSubscriptionDiscountService,
} from "../services/Subscription.service.js";

/* ── PUBLIC ─────────────────────────────────────────────────────────────── */
export const listPlans = async (req, res) => {
  try {
    const data = await listPlansService();
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch subscription plans" });
  }
};

export const getPlan = async (req, res) => {
  try {
    const data = await getPlanByIdService(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(404).json({ success: false, message: e.message });
  }
};

/* ── ADMIN ──────────────────────────────────────────────────────────────── */
export const createPlan = async (req, res) => {
  try {
    // Silently ignore any plan_type sent — always USER
    const { plan_type, ...body } = req.body;
    const data = await createPlanService(body);
    res.status(201).json({ success: true, message: "Subscription plan created", data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { plan_type, ...body } = req.body; // ignore plan_type changes
    const data = await updatePlanService(req.params.id, body);
    res.json({ success: true, message: "Subscription plan updated", data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* ── USER ───────────────────────────────────────────────────────────────── */
export const subscribe = async (req, res) => {
  try {
    const { plan_id, utr_number } = req.body;
    if (!plan_id) {
      return res.status(400).json({ success: false, message: "Please select a subscription plan" });
    }
    if (!utr_number) {
      return res.status(400).json({
        success: false,
        message: "Please provide your UTR / Transaction ID after paying for the subscription",
      });
    }
    const data = await subscribeToPlanService(req.account.id, plan_id, utr_number);
    res.json({ success: true, message: data.message, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const data = await getMySubscriptionService(req.account.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch your subscription" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const data = await cancelSubscriptionService(req.account.id, req.params.id);
    res.json({
      success: true,
      message: "Your subscription has been cancelled. You will retain access until the end of your current billing period.",
      data,
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

/* ── USER: Get my current discount percentage ───────────────────────────── */
export const getMyDiscount = async (req, res) => {
  try {
    const discount = await getUserSubscriptionDiscountService(req.account.id);
    res.json({
      success: true,
      data: {
        discount_percentage: discount,
        has_discount: discount > 0,
        message: discount > 0
          ? `You have an active subscription giving you ${discount}% off on all class bookings.`
          : "Subscribe to a plan to get discounts on class bookings.",
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Could not fetch discount info" });
  }
};
