import admin from "../config/firebase.js";

export const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing Authorization token"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || null,
      phone_number: decoded.phone_number || null
    };

    next();
  } catch (error) {
    console.error("Firebase Auth Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired Firebase token"
    });
  }
};

export const requireAuth = firebaseAuth;