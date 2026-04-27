import {
  trainerSignupService,
  trainerSigninService,
  addTrainerByInstituteService
} from "../services/trainer.service.js";

export const trainerSignup = async (req, res) => {
  try {
    const data = await trainerSignupService(req.firebaseUser, req.body);

    return res.status(201).json({
      success: true,
      message: "Trainer signup completed. Waiting for admin approval.",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const trainerSignin = async (req, res) => {
  try {
    if (req.account.role !== "TRAINER") {
      return res.status(403).json({
        success: false,
        message: "Only trainer can signin here"
      });
    }

    const trainer = await trainerSigninService(req.account.id);

    return res.status(200).json({
      success: true,
      message:
        trainer.approval_status === "APPROVED"
          ? "Trainer signin successful"
          : "Trainer signin successful, waiting for admin approval",
      data: {
        account: req.account,
        trainer
      }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const addTrainerByInstitute = async (req, res) => {
  try {
    const trainer = await addTrainerByInstituteService(
      req.institute.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Trainer added successfully. Waiting for admin approval.",
      data: trainer
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};