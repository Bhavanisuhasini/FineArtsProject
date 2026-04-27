import express from "express";
import {
  getAllSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";

<<<<<<< HEAD
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

=======
const router = express.Router();

// Public
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
router.get("/", getAllSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategoryId);
router.get("/:id", getSubcategoryById);

<<<<<<< HEAD
router.post("/", adminAuth, createSubcategory);
router.put("/:id", adminAuth, updateSubcategory);
router.delete("/:id", adminAuth, deleteSubcategory);
=======
// Protected later
router.post("/", createSubcategory);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2

export default router;