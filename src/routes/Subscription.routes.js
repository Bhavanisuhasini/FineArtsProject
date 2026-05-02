import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js"; // 👈 add this

import {
 listPlans,
 getPlan,
 createPlan,
 updatePlan,
 subscribe,
 getMySubscription,
 cancelSubscription,
} from "../controllers/subscription.controller.js";

const router = express.Router();

// ✅ Public — anyone can view plans
router.get("/", listPlans);
router.get("/:id", getPlan);

// ✅ Admin — create/update plans (FIXED)
router.post("/", adminAuth, createPlan); // 👑 admin only
router.put("/:id", adminAuth, updatePlan); // 👑 admin only

// ✅ Users — subscription actions
router.post("/subscribe", firebaseAuth, subscribe);
router.get("/my/active", firebaseAuth, getMySubscription);
router.delete("/cancel/:id", firebaseAuth, cancelSubscription);

export default router;