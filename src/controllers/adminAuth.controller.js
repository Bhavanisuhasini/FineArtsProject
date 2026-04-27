import { adminLoginService } from "../services/adminAuth.service.js";

export const adminLogin = async (req, res) => {
  try {
    const data = await adminLoginService(req.body);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};