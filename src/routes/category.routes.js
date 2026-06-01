// import express from "express";
// import {
//   getAllCategories,
//   getCategoryById,
//   createCategory,
//   updateCategory,
//   deleteCategory,
// } from "../controllers/category.controller.js";

// import { adminAuth } from "../middlewares/adminAuth.js";

// const router = express.Router();

// router.get("/", getAllCategories);
// router.get("/:id", getCategoryById);

// router.post("/", adminAuth, createCategory);
// router.put("/:id", adminAuth, updateCategory);
// router.delete("/:id", adminAuth, deleteCategory);

// export default router;

import express from "express";

import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

import { adminAuth } from "../middlewares/adminAuth.js";
import { upload } from "../middlewares/s3Upload.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

router.post(
  "/",
  adminAuth,
  upload.single("image"),
  createCategory
);

router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  updateCategory
);

router.delete("/:id", adminAuth, deleteCategory);

export default router;