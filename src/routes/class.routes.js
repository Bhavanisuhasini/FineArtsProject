import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/institute",
  requireAuth,
  allowRoles("INSTITUTE"),
  (req, res) => res.send("Institute class created")
);

router.post("/trainer",
  requireAuth,
  allowRoles("TRAINER"),
  (req, res) => res.send("Trainer class created")
);

export default router;