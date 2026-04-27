import express from "express";
import {
  getAllSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";


import { adminAuth } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();




router.get("/", getAllSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategoryId);
router.get("/:id", getSubcategoryById);


router.post("/", adminAuth, createSubcategory);
router.put("/:id", adminAuth, updateSubcategory);
router.delete("/:id", adminAuth, deleteSubcategory);

export default router;