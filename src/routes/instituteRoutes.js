import express from "express";
import { firebaseAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import {
  instituteSignup,
  instituteSignin,
  getMyInstitute
} from "../controllers/institute.controller.js";

const router = express.Router();

router.post("/signup", firebaseAuth, instituteSignup);

router.post(
  "/signin",
  requireAuth,
  allowRoles("INSTITUTE"),
  instituteSignin
);

router.get(
  "/my/profile",
  requireAuth,
  allowRoles("INSTITUTE"),
  getMyInstitute
);

export default router;