import express from "express";
import * as controller from "../controllers/trainer.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, controller.createTrainer);
router.get("/", controller.getAllTrainers);

router.get("/my/profile", auth, controller.getMyTrainer);
router.get("/institute/:instituteId", controller.getByInstitute);
router.get("/category/:categoryId", controller.getByCategory);
router.get("/subcategory/:subcategoryId", controller.getBySubcategory);

router.get("/:id", controller.getTrainerById);

router.put("/:id", auth, controller.updateTrainer);
router.post("/:id/upload", auth, controller.uploadMedia);
router.delete("/:id", auth, controller.deleteTrainer);

export default router;