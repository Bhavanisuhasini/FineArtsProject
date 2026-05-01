import {
  listPlansService,
  getPlanByIdService,
  createPlanService,
  updatePlanService,
  subscribeToPlanService,
  getMySubscriptionService,
  cancelSubscriptionService,
} from "../services/subscription.service.js";

// ── PUBLIC ──────────────────────────────────────────────────────────────────
export const listPlans = async (req, res) => {
  try {
    const data = await listPlansService(req.query.plan_type);
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getPlan = async (req, res) => {
  try {
    const data = await getPlanByIdService(req.params.id);
    res.json({ success: true, data });
  } catch (e) { res.status(404).json({ message: e.message }); }
};

// ── ADMIN ────────────────────────────────────────────────────────────────────
export const createPlan = async (req, res) => {
  try {
    const data = await createPlanService(req.body);
    res.status(201).json({ success: true, message: "Plan created", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const updatePlan = async (req, res) => {
  try {
    const data = await updatePlanService(req.params.id, req.body);
    res.json({ success: true, message: "Plan updated", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// ── USER ─────────────────────────────────────────────────────────────────────
export const subscribe = async (req, res) => {
  try {
    const { plan_id, payment_id } = req.body;
    if (!plan_id) return res.status(400).json({ message: "plan_id is required" });
    const data = await subscribeToPlanService(req.account.id, plan_id, payment_id);
    res.json({ success: true, message: "Subscribed successfully", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const getMySubscription = async (req, res) => {
  try {
    const data = await getMySubscriptionService(req.account.id);
    res.json({ success: true, data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const cancelSubscription = async (req, res) => {
  try {
    const data = await cancelSubscriptionService(req.account.id, req.params.id);
    res.json({ success: true, message: "Subscription cancelled", data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};