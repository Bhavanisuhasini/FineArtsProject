// import express from "express";
// import {
//   getAllSubcategories,
//   getSubcategoryById,
//   getSubcategoriesByCategoryId,
//   createSubcategory,
//   updateSubcategory,
//   deleteSubcategory,
// } from "../controllers/subcategory.controller.js";


// import { adminAuth } from "../middlewares/adminAuth.js";

// const router = express.Router();




// router.get("/", getAllSubcategories);
// router.get("/category/:categoryId", getSubcategoriesByCategoryId);
// router.get("/:id", getSubcategoryById);


// router.post("/", adminAuth, createSubcategory);
// router.put("/:id", adminAuth, updateSubcategory);
// router.delete("/:id", adminAuth, deleteSubcategory);

// export default router;

import express from "express";

import {
  getAllSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../controllers/subcategory.controller.js";

import { adminAuth } from "../middlewares/adminAuth.js";
import { upload } from "../middlewares/s3Upload.js";

const router = express.Router();

router.get("/", getAllSubcategories);
router.get("/category/:categoryId", getSubcategoriesByCategoryId);
router.get("/:id", getSubcategoryById);

router.post(
  "/",
  adminAuth,
  upload.single("image"),
  createSubcategory
);

router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  updateSubcategory
);

router.delete("/:id", adminAuth, deleteSubcategory);

export default router;