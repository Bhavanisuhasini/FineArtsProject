import express from "express";
import * as controller from "../controllers/category.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { admin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", auth, admin, controller.createCategory);
router.get("/", controller.getAllCategories);
router.get("/:id", controller.getCategoryById);
router.put("/:id", auth, admin, controller.updateCategory);
router.delete("/:id", auth, admin, controller.deleteCategory);

export default router;