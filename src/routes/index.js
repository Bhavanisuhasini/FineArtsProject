import express from "express";

import categoryRoutes from "./category.routes.js";
import subcategoryRoutes from "./subcategory.routes.js";
import instituteRoutes from "./instituteRoutes.js";
import trainerRoutes from "./trainerRoutes.js";
import classRoutes from "./class.routes.js";
import bookingRoutes from "./booking.routes.js";
// import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";
import notificationRoutes from "./notification.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./userRoutes.js";
import adminAuthRoutes from "./adminAuth.routes.js";
import couponRoutes from "./coupon.routes.js";
import sessionRoutes from "./session.routes.js";


// was: import paymentRoutes from "./payment.routes.js";
import paymentRoutes from "./payment.routes.js";



const router = express.Router();
// was: // router.use("/payments", paymentRoutes);
router.use("/payments", paymentRoutes);  // ✅ uncomment this
// ✅ AUTH
router.use("/admin-auth", adminAuthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// ✅ CORE
router.use("/categories", categoryRoutes);
router.use("/subcategories", subcategoryRoutes);
router.use("/institutes", instituteRoutes);
router.use("/trainers", trainerRoutes);
router.use("/classes", classRoutes);

// ✅ BOOKING SYSTEM
router.use("/bookings", bookingRoutes);
router.use("/sessions", sessionRoutes);


// ✅ ADMIN + DASHBOARD
router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);

export default router;