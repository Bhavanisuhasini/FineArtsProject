import express from "express";
import * as controller from "../controllers/institute.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", auth, controller.createInstitute);
router.get("/", controller.getAllInstitutes);
router.get("/my/profile", auth, controller.getMyInstitute);
router.get("/category/:categoryId", controller.getByCategory);
router.get("/filter", controller.filterInstitutes);
router.get("/:id", controller.getInstituteById);
router.put("/:id", auth, controller.updateInstitute);
router.post("/:id/upload", auth, controller.uploadMedia);
router.delete("/:id", auth, controller.deleteInstitute);

export default router;