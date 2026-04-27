import {
  instituteSignupService,
  instituteSigninService,
  getMyInstituteService
} from "../services/institute.service.js";

export const instituteSignup = async (req, res) => {
  try {
    const data = await instituteSignupService(req.firebaseUser, req.body);

    return res.status(201).json({
      success: true,
      message: "Institute signup completed. Waiting for admin approval.",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const instituteSignin = async (req, res) => {
  try {
    if (req.account.role !== "INSTITUTE") {
      return res.status(403).json({
        success: false,
        message: "Only institute can signin here"
      });
    }

    const institute = await instituteSigninService(req.account.id);

    return res.status(200).json({
      success: true,
      message:
        institute.approval_status === "APPROVED"
          ? "Institute signin successful"
          : "Institute signin successful, waiting for admin approval",
      data: {
        account: req.account,
        institute
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyInstitute = async (req, res) => {
  try {
    const institute = await getMyInstituteService(req.account.id);

    return res.status(200).json({
      success: true,
      message: "Institute profile fetched successfully",
      data: institute
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};