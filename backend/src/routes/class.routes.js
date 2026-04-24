import express from "express";
import * as controller from "../controllers/class.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, controller.createClass);
router.get("/", controller.getAllClasses);

router.get("/my/classes", auth, controller.getMyClasses);
router.get("/institute/:instituteId", controller.getByInstitute);
router.get("/trainer/:trainerId", controller.getByTrainer);
router.get("/category/:categoryId", controller.getByCategory);
router.get("/subcategory/:subcategoryId", controller.getBySubcategory);

router.get("/:id", controller.getClassById);

router.put("/:id", auth, controller.updateClass);
router.delete("/:id", auth, controller.deleteClass);

router.patch("/:id/meeting-link", auth, controller.addMeetingLink);
router.patch("/:id/status", auth, controller.changeStatus);

export default router;