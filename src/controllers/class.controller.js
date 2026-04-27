import {
  createClassByInstituteService,
  createClassByTrainerService
} from "../services/class.service.js";

export const createClassByInstitute = async (req, res) => {
  try {
    const data = await createClassByInstituteService(
      req.institute.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Class created by institute successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const createClassByTrainer = async (req, res) => {
  try {
    const data = await createClassByTrainerService(
      req.trainer.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Class created by trainer successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};