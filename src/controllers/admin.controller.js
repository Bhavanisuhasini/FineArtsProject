import {
  getPendingInstitutesService,
  approveInstituteService,
  rejectInstituteService,
  getPendingTrainersService,
  approveTrainerService,
  rejectTrainerService
} from "../services/admin.service.js";

export const getPendingInstitutes = async (req, res) => {
  try {
    const data = await getPendingInstitutesService();

    return res.status(200).json({
      success: true,
      message: "Pending institutes fetched successfully",
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const approveInstitute = async (req, res) => {
  try {
    const data = await approveInstituteService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Institute approved successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const rejectInstitute = async (req, res) => {
  try {
    const data = await rejectInstituteService(
      req.params.id,
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      message: "Institute rejected successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getPendingTrainers = async (req, res) => {
  try {
    const data = await getPendingTrainersService();

    return res.status(200).json({
      success: true,
      message: "Pending trainers fetched successfully",
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const approveTrainer = async (req, res) => {
  try {
    const data = await approveTrainerService(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Trainer approved successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const rejectTrainer = async (req, res) => {
  try {
    const data = await rejectTrainerService(
      req.params.id,
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      message: "Trainer rejected successfully",
      data
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};