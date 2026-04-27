import express from "express";
import categoryRoutes from "./category.routes.js";
import subcategoryRoutes from "./subcategory.routes.js";
<<<<<<< HEAD
import instituteRoutes from "./instituteRoutes.js";
import trainerRoutes from "./trainerRoutes.js";
import classRoutes from "./class.routes.js"; 
import bookingRoutes from "./booking.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";
import notificationRoutes from "./notification.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import adminAuthRoutes from "./adminAuth.routes.js";


const router = express.Router();


router.use("/admin-auth", adminAuthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);
router.use("/institutes", instituteRoutes);
router.use("/trainers", trainerRoutes);
router.use("/classes", classRoutes); 
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

=======

const router = express.Router();

router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2

export default router;