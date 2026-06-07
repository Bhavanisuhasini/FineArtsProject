// import express from "express";
// import { firebaseAuth } from "../middlewares/firebaseAuth.js";
// import { accountAuth } from "../middlewares/accountAuth.js";
// import { login, me } from "../controllers/authController.js";

// const router = express.Router();

// router.post("/login", firebaseAuth, login);
// router.get("/me", firebaseAuth, accountAuth, me);

// export default router;



// 📁 src/routes/auth.routes.js

import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);

export default router;