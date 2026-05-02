import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import { accountAuth } from "../middlewares/accountAuth.js";
import { roleAuth } from "../middlewares/roleAuth.js";

import {
 createOrUpdateProfile,
 getMyProfile
} from "../controllers/userController.js";

const router = express.Router();

router.post(
 "/profile",
 firebaseAuth,
 accountAuth,
 roleAuth("USER"),
 createOrUpdateProfile
);

router.get(
 "/profile",
 firebaseAuth,
 accountAuth,
 roleAuth("USER"),
 getMyProfile
);

export default router;