import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

import {
 listPlans,
 getPlan,
 createPlan,
 updatePlan,
 subscribe,
 getMySubscription,
 cancelSubscription,
 getMyDiscount,
} from "../controllers/Subscription.controller.js";

const router = express.Router();

// Public — anyone can view plans
router.get("/", listPlans);
router.get("/plans/:id", getPlan);

// Admin — create/update plans
router.post("/", adminAuth, createPlan);
router.put("/:id", adminAuth, updatePlan);

// Users — subscription actions
router.post("/subscribe",      firebaseAuth, accountAuth, subscribe);
router.get("/my/active",       firebaseAuth, accountAuth, getMySubscription);
router.get("/my/discount",     firebaseAuth, accountAuth, getMyDiscount);
router.delete("/cancel/:id",   firebaseAuth, accountAuth, cancelSubscription);

export default router;