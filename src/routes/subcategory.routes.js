import express from "express";
import {
  getAllSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";

const router = express.Router();

// Public
router.get("/", getAllSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategoryId);
router.get("/:id", getSubcategoryById);

// Protected later
router.post("/", createSubcategory);
router.put("/:id", updateSubcategory);
router.delete("/:id", deleteSubcategory);

export default router;