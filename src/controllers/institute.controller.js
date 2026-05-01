import {
  instituteLoginService,
  instituteCompleteProfileService,
  getInstituteProfileService,
  listInstitutesService,
  getInstituteTrainersService,
  updateTrainerApprovalService,
} from "../services/institute.service.js";

export const instituteLogin = async (req, res) => {
  try {
    const data = await instituteLoginService(req.firebaseUser);
    res.json({ success: true, message: "Institute login successful", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const instituteCompleteProfile = async (req, res) => {
  try {
    const data = await instituteCompleteProfileService(req.account.id, req.body);
    res.json({ success: true, message: "Institute profile completed", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getInstituteProfile = async (req, res) => {
  try {
    const data = await getInstituteProfileService(req.account.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const listInstitutes = async (req, res) => {
  try {
    const data = await listInstitutesService(req.query);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const getInstituteTrainers = async (req, res) => {
  try {
    const data = await getInstituteTrainersService(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const updateTrainerApproval = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { status, reason } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
    }
    const data = await updateTrainerApprovalService(req.account.id, trainerId, status, reason);
    res.json({ success: true, message: `Trainer ${status.toLowerCase()}`, data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};