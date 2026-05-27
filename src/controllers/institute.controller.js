// import {
//   instituteLoginService,
//   instituteCompleteProfileService,
//   getInstituteProfileService,
//   listInstitutesService,
//   getInstituteTrainersService,
//   updateTrainerApprovalService,
// } from "../services/institute.service.js";

// export const instituteLogin = async (req, res) => {
//   try {
//     const data = await instituteLoginService(req.firebaseUser);
//     res.json({ success: true, message: "Institute login successful", data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export const instituteCompleteProfile = async (req, res) => {
//   try {
//     const data = await instituteCompleteProfileService(req.account.id, req.body);
//     res.json({ success: true, message: "Institute profile completed", data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export const getInstituteProfile = async (req, res) => {
//   try {
//     const data = await getInstituteProfileService(req.account.id);
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export const listInstitutes = async (req, res) => {
//   try {
//     const data = await listInstitutesService(req.query);
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export const getInstituteTrainers = async (req, res) => {
//   try {
//     const data = await getInstituteTrainersService(req.params.id);
//     res.json({ success: true, data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }
// };

// export const updateTrainerApproval = async (req, res) => {
//   try {
//     const { trainerId } = req.params;
//     const { status, reason } = req.body;
//     if (!["APPROVED", "REJECTED"].includes(status)) {
//       return res.status(400).json({ message: "status must be APPROVED or REJECTED" });
//     }
//     const data = await updateTrainerApprovalService(req.account.id, trainerId, status, reason);
//     res.json({ success: true, message: `Trainer ${status.toLowerCase()}`, data });
//   } catch (e) {
//     res.status(400).json({ message: e.message });
//   }


import {
  instituteLoginService,
  createInstituteService,
  instituteCompleteProfileService,
  getInstituteProfileService,
  listInstitutesService,
  getInstituteTrainersService,
  updateTrainerApprovalService,
} from "../services/institute.service.js";

/* ───────── LOGIN ───────── */
export const instituteLogin = async (req, res) => {
  try {
    const result = await instituteLoginService(req.user);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── CREATE INSTITUTE (MULTI-INSTITUTE FIX) ───────── */
// export const createInstitute = async (req, res) => {
//   try {
//     const accountId = req.account?.id;

//     if (!accountId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const institute = await createInstituteService(accountId, req.body);

//     return res.json({
//       success: true,
//       message: "Institute created successfully",
//       data: institute,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };


export const createInstitute = async (req, res) => {
  try {
    const accountId = req.account?.id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const institute = await createInstituteService(accountId, req.body);

    return res.json({
      success: true,
      message: "Institute created successfully",
      data: institute,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── COMPLETE PROFILE ───────── */
export const instituteCompleteProfile = async (req, res) => {
  try {
    const accountId = req.account?.id;

    const result = await instituteCompleteProfileService(accountId, req.body);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── GET PROFILE ───────── */
export const getInstituteProfile = async (req, res) => {
  try {
    const accountId = req.account?.id;

    const result = await getInstituteProfileService(accountId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── LIST INSTITUTES ───────── */
export const listInstitutes = async (req, res) => {
  try {
    const result = await listInstitutesService(req.query);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── GET TRAINERS ───────── */
export const getInstituteTrainers = async (req, res) => {
  try {
    const instituteId = req.params.id;

    const trainers = await getInstituteTrainersService(instituteId);

    return res.json({
      success: true,
      data: trainers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ───────── UPDATE TRAINER APPROVAL ───────── */
export const updateTrainerApproval = async (req, res) => {
  try {
    const instituteAccountId = req.account?.id;
    const { trainerId } = req.params;
    const { status, reason } = req.body;

    const result = await updateTrainerApprovalService(
      instituteAccountId,
      trainerId,
      status,
      reason
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};