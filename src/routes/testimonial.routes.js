import express from "express";

import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonial.controller.js";

import { adminAuth } from "../middlewares/adminAuth.js";
import { upload } from "../middlewares/s3Upload.js";

const router = express.Router();

router.get(
  "/",
  getTestimonials
);

router.post(
  "/",
  upload.single("avatar"),
  createTestimonial
);

router.put(
  "/:id",
  upload.single("avatar"),
  updateTestimonial
);

router.delete(
  "/:id",
  deleteTestimonial
);

export default router;