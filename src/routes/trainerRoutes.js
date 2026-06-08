import express from "express";

import {
  trainerLogin,
  trainerCompleteProfile,
  getTrainerPublicProfile,
  getMyTrainerProfile,
  updateTrainerQR,
  getAllTrainers,

  createTrainerByAdmin,
  updateTrainerByAdmin,
  deleteTrainerByAdmin,

  getInstituteTrainers,
  createTrainerByInstitute,
  updateTrainerByInstitute,
  deleteTrainerByInstitute,
} from "../controllers/trainer.controller.js";

import firebaseAuth  from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { upload } from "../middlewares/s3Upload.js";

const router = express.Router();

/* TRAINER SELF */

router.post(
  "/login",
  firebaseAuth,
  trainerLogin
);

router.post(
  "/complete-profile",
  firebaseAuth,
  accountAuth,
  trainerCompleteProfile
);

router.get(
  "/me",
  firebaseAuth,
  accountAuth,
  getMyTrainerProfile
);

router.put(
  "/update-qr",
  firebaseAuth,
  accountAuth,
  updateTrainerQR
);

/* ADMIN */

router.post(
  "/admin-create",
  adminAuth,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "qr_image", maxCount: 1 },
  ]),
  createTrainerByAdmin
);

router.put(
  "/admin-update/:id",
  adminAuth,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "qr_image", maxCount: 1 },
  ]),
  updateTrainerByAdmin
);

router.delete(
  "/admin-delete/:id",
  adminAuth,
  deleteTrainerByAdmin
);

/* INSTITUTE */

router.get(
  "/institute",
    firebaseAuth,
  accountAuth,
  getInstituteTrainers
);

router.post(
  "/institute-create",
  firebaseAuth,
  accountAuth,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "qr_image", maxCount: 1 },
  ]),
  createTrainerByInstitute
);

router.put(
  "/institute-update/:id",
  firebaseAuth,
  accountAuth,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
    { name: "qr_image", maxCount: 1 },
  ]),
  updateTrainerByInstitute
);

router.delete(
  "/institute-delete/:id",
  firebaseAuth,
  accountAuth,
  deleteTrainerByInstitute
);

/* PUBLIC */

router.get("/", getAllTrainers);

router.get("/:id", getTrainerPublicProfile);

export default router;