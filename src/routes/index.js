import express from "express";
import categoryRoutes from "./category.routes.js";
import subcategoryRoutes from "./subcategory.routes.js";

const router = express.Router();

router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);

export default router;