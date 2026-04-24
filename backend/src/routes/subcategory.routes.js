import express from "express";
import * as controller from "../controllers/subcategory.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { admin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", auth, admin, controller.createSubcategory);
router.get("/", controller.getAllSubcategories);
router.get("/:id", controller.getSubcategoryById);
router.get("/category/:categoryId", controller.getSubcategoriesByCategory);
router.put("/:id", auth, admin, controller.updateSubcategory);
router.delete("/:id", auth, admin, controller.deleteSubcategory);

export default router;