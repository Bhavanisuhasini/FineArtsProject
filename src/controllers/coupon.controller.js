import {
  validateCouponService,
  createCouponService,
  listCouponsService,
  toggleCouponService,
  getMyRewardsService,
  redeemPointsService,
} from "../services/coupon.service.js";

const ok  = (res, data, msg = "Success", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, status = 400) => res.status(status).json({ success: false, message: e.message });

/* ── USER: VALIDATE COUPON BEFORE PAYMENT ───────────────────────────────── */
export const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code || !amount) return fail(res, new Error("code and amount are required"));
    const data = await validateCouponService(req.account.id, code, amount);
    ok(res, data, "Coupon applied successfully");
  } catch (e) { fail(res, e); }
};

/* ── USER: GET MY REWARDS ───────────────────────────────────────────────── */
export const getMyRewards = async (req, res) => {
  try {
    const data = await getMyRewardsService(req.account.id);
    ok(res, data);
  } catch (e) { fail(res, e); }
};

/* ── USER: REDEEM POINTS ────────────────────────────────────────────────── */
export const redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || parseInt(points) <= 0) return fail(res, new Error("points must be a positive number"));
    const data = await redeemPointsService(req.account.id, parseInt(points));
    ok(res, data, `Redeemed ${points} points for ₹${data.discount_amount} discount`);
  } catch (e) { fail(res, e); }
};

/* ── ADMIN: CREATE COUPON ───────────────────────────────────────────────── */
export const createCoupon = async (req, res) => {
  try {
    const data = await createCouponService(req.admin.id, req.body);
    ok(res, data, "Coupon created", 201);
  } catch (e) { fail(res, e); }
};

/* ── ADMIN: LIST ALL COUPONS ────────────────────────────────────────────── */
export const listCoupons = async (req, res) => {
  try {
    const data = await listCouponsService();
    ok(res, data);
  } catch (e) { fail(res, e); }
};

/* ── ADMIN: TOGGLE COUPON ACTIVE STATUS ─────────────────────────────────── */
export const toggleCoupon = async (req, res) => {
  try {
    const { is_active } = req.body;
    const data = await toggleCouponService(req.params.id, is_active);
    ok(res, data, `Coupon ${is_active ? "activated" : "deactivated"}`);
  } catch (e) { fail(res, e); }
};
