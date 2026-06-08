// import express from "express";

// import { firebaseAuth } from "../middlewares/firebaseAuth.js";
// import { accountAuth } from "../middlewares/accountAuth.js";

// import {
//   createClassByInstitute,
//   createClassByTrainer,
//   listClasses,
//   updateClass,
//   deleteClass,
//   applyToInstitute,
//   addTrainerToInstitute,
//   getTrainerApplications,
//   respondToTrainerApplication,
//   getClassById, // ✅ SAFE single class (recommended)
// } from "../controllers/class.controller.js";

// const router = express.Router();

// /* =========================================================
//    PUBLIC ROUTES
// ========================================================= */

// // Get all classes (used by your frontend ClassesPage)
// router.get("/", listClasses);

// // Get single class (class details page)
// router.get("/:id", getClassById);

// /* =========================================================
//    INSTITUTE ROUTES
// ========================================================= */

// // Create class by institute
// router.post(
//   "/institute/create",
//   firebaseAuth,
//   accountAuth,
//   createClassByInstitute
// );

// // Update class by institute
// router.put(
//   "/institute/:id",
//   firebaseAuth,
//   accountAuth,
//   updateClass
// );

// // Delete class by institute
// router.delete(
//   "/institute/:id",
//   firebaseAuth,
//   accountAuth,
//   deleteClass
// );

// // Add trainer to institute class
// router.post(
//   "/institute/add-trainer",
//   firebaseAuth,
//   accountAuth,
//   addTrainerToInstitute
// );

// // Get trainer applications
// router.get(
//   "/institute/trainer-applications",
//   firebaseAuth,
//   accountAuth,
//   getTrainerApplications
// );

// // Approve / Reject trainer application
// router.patch(
//   "/institute/trainer-applications/:trainerId",
//   firebaseAuth,
//   accountAuth,
//   respondToTrainerApplication
// );

// /* =========================================================
//    TRAINER ROUTES
// ========================================================= */

// // Create class by trainer
// router.post(
//   "/trainer/create",
//   firebaseAuth,
//   accountAuth,
//   createClassByTrainer
// );

// // Update class by trainer
// router.put(
//   "/trainer/:id",
//   firebaseAuth,
//   accountAuth,
//   updateClass
// );

// // Delete class by trainer
// router.delete(
//   "/trainer/:id",
//   firebaseAuth,
//   accountAuth,
//   deleteClass
// );

// // Trainer applies to institute
// router.post(
//   "/trainer/apply-institute",
//   firebaseAuth,
//   accountAuth,
//   applyToInstitute
// );

// export default router;



import express from "express";

import firebaseAuth  from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";

import {
  createClassByInstitute,
  createClassByTrainer,
  listClasses,
  updateClass,
  deleteClass,
  applyToInstitute,
  addTrainerToInstitute,
  getTrainerApplications,
  respondToTrainerApplication,
  getClassById,
  getClassesByTrainer,
  createClassByAdmin,
} from "../controllers/class.controller.js";

const router = express.Router();

/* =========================================================
   SPECIFIC ROUTES (Must be defined FIRST to avoid conflicts)
========================================================= */

/* ---------------- INSTITUTE ROUTES ---------------- */
router.post(
  "/institute/create",
  firebaseAuth,
  accountAuth,
  createClassByInstitute
);

router.put(
  "/institute/:id",
  firebaseAuth,
  accountAuth,
  updateClass
);

router.delete(
  "/institute/:id",
  firebaseAuth,
  accountAuth,
  deleteClass
);

router.post(
  "/institute/add-trainer",
  firebaseAuth,
  accountAuth,
  addTrainerToInstitute
);

router.get(
  "/institute/trainer-applications",
  firebaseAuth,
  accountAuth,
  getTrainerApplications
);

router.patch(
  "/institute/trainer-applications/:trainerId",
  firebaseAuth,
  accountAuth,
  respondToTrainerApplication
);

/* ---------------- TRAINER ROUTES ---------------- */
router.post(
  "/trainer/create",
  firebaseAuth,
  accountAuth,
  createClassByTrainer
);

router.put(
  "/trainer/:id",
  firebaseAuth,
  accountAuth,
  updateClass
);

router.delete(
  "/trainer/:id",
  firebaseAuth,
  accountAuth,
  deleteClass
);

router.post(
  "/trainer/apply-institute",
  firebaseAuth,
  accountAuth,
  applyToInstitute
);

/* =========================================================
   PUBLIC / GENERIC ROUTES (Must be defined LAST)
========================================================= */

// Get all classes (Public listing)
router.get("/", listClasses);


router.get(
  "/trainer/:trainerId",
  getClassesByTrainer
);

// Get single class by ID (Public detail page)
// NOTE: This is generic, so it must be at the bottom to catch any ID
// that wasn't matched by specific routes above.
router.get("/:id", getClassById);


/* ---------------- ADMIN ROUTES ---------------- */
router.post(
  "/admin/create",
  createClassByAdmin
);

router.put(
  "/admin/:id",
  updateClass
);

router.delete(
  "/admin/:id",
  deleteClass
);

export default router;