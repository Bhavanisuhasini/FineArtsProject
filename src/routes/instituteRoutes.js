// // import express from "express";
// // import { firebaseAuth } from "../middlewares/firebaseAuth.js";
// // import { accountAuth } from "../middlewares/accountAuth.js";
// // import {
// //   instituteLogin,
// //   instituteCompleteProfile,
// //   getInstituteProfile,
// //   listInstitutes,
// //   getInstituteTrainers,
// //   updateTrainerApproval,
// // } from "../controllers/institute.controller.js";

// // const router = express.Router();

// // // Auth
// // router.post("/login",            firebaseAuth, instituteLogin);
// // router.put("/complete-profile",  firebaseAuth, accountAuth, instituteCompleteProfile);
// // router.get("/profile",           firebaseAuth, accountAuth, getInstituteProfile);

// // // Public listing
// // router.get("/",                  listInstitutes);
// // router.get("/:id/trainers",      getInstituteTrainers);

// // // Institute manages its trainers
// // router.put("/trainers/:trainerId/approval", firebaseAuth, accountAuth, updateTrainerApproval);

// // export default router;

// import express from "express";
// import { firebaseAuth } from "../middlewares/firebaseAuth.js";
// import { accountAuth } from "../middlewares/accountAuth.js";

// import {
//   instituteLogin,
//   createInstitute,
//   instituteCompleteProfile,
//   getInstituteProfile,
//   listInstitutes,
//   getInstituteTrainers,
//   updateTrainerApproval,
// } from "../controllers/institute.controller.js";

// const router = express.Router();

// /* ───────── AUTH ───────── */
// router.post("/login", firebaseAuth, instituteLogin);

// /* ───────── CREATE MULTIPLE INSTITUTES (FIXED) ───────── */
// router.post("/create", firebaseAuth, accountAuth, createInstitute);

// /* ───────── PROFILE ───────── */
// router.put(
//   "/complete-profile",
//   firebaseAuth,
//   accountAuth,
//   instituteCompleteProfile
// );

// router.get(
//   "/profile",
//   firebaseAuth,
//   accountAuth,
//   getInstituteProfile
// );

// /* ───────── PUBLIC LIST ───────── */
// router.get("/", listInstitutes);

// /* IMPORTANT: trainers route must come BEFORE :id dynamic conflicts if any future */
// router.get("/:id/trainers", getInstituteTrainers);

// /* ───────── TRAINER APPROVAL ───────── */
// router.put(
//   "/trainers/:trainerId/approval",
//   firebaseAuth,
//   accountAuth,
//   updateTrainerApproval
// );

// export default router;

import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import accountAuth from "../middlewares/accountAuth.js";
import {
  instituteLogin,
  createInstitute,
  instituteCompleteProfile,
  getInstituteProfile,
  listInstitutes,
  getInstituteTrainers,
  updateTrainerApproval,
} from "../controllers/institute.controller.js";

const router = express.Router();

router.post("/login", firebaseAuth, accountAuth, instituteLogin);

router.post("/create", firebaseAuth, accountAuth, createInstitute);

router.put("/complete-profile", firebaseAuth, accountAuth, instituteCompleteProfile);

router.get("/profile", firebaseAuth, accountAuth, getInstituteProfile);

router.get("/", listInstitutes);

router.get("/:id/trainers", getInstituteTrainers);

router.put("/trainers/:trainerId/approval", firebaseAuth, accountAuth, updateTrainerApproval);

export default router;