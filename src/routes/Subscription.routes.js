import express from "express";
import { firebaseAuth } from "../middlewares/auth.middleware.js";
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

// Public — anyone can view plans
router.get("/",       listPlans);        // ?plan_type=USER|TRAINER|INSTITUTE
router.get("/:id",    getPlan);

// Admin — create/update plans
router.post("/",          firebaseAuth, createPlan);
router.put("/:id",        firebaseAuth, updatePlan);

// Authenticated users — subscribe / view / cancel
router.post("/subscribe",         firebaseAuth, subscribe);
router.get("/my/active",          firebaseAuth, getMySubscription);
router.delete("/cancel/:id",      firebaseAuth, cancelSubscription);

export default router;