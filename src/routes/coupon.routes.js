import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";
import {
  validateCoupon,
  getMyRewards,
  redeemPoints,
  createCoupon,
  listCoupons,
  toggleCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

// User routes
router.post("/validate",   firebaseAuth, accountAuth, validateCoupon);
router.get("/rewards/my",  firebaseAuth, accountAuth, getMyRewards);
router.post("/rewards/redeem", firebaseAuth, accountAuth, redeemPoints);

// Admin routes
router.get("/",            adminAuth, listCoupons);
router.post("/",           adminAuth, createCoupon);
router.patch("/:id/toggle", adminAuth, toggleCoupon);

export default router;
