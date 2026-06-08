
import {
  instituteLoginService,
  createInstituteService,
  instituteCompleteProfileService,
  getInstituteProfileService,
  listInstitutesService,
  getAllInstitutesAdminService,
  updateInstituteApprovalService,
  getInstituteDashboardService,
  getInstituteStudentsService,
  getInstituteBookingsService,


} from "../services/institute.service.js";

/* LOGIN */
export const instituteLogin = async (req, res) => {
  try {
    const result = await instituteLoginService(req.firebaseUser);

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

/* PROFILE */
export const createInstituteProfile = async (req, res) => {
   
  console.log("BODY =", req.body);
  console.log("ACCOUNT =", req.account);

  try {
    const result = await instituteCompleteProfileService(
      req.account?.id,
      req.body
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

export const getInstituteProfile = async (req, res) => {
  try {
    const result = await getInstituteProfileService(
      req.account?.id
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

/* APPROVAL REQUEST */
export const submitApprovalRequest = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Approval request submitted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* DASHBOARD */
export const getInstituteDashboard = async (
  req,
  res
) => {
  try {

    console.log(
      "ACCOUNT =",
      req.account
    );

    const dashboard =
      await getInstituteDashboardService(
        req.account.id
      );

    return res.json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* STUDENTS */
export const getInstituteStudents = async (
  req,
  res
) => {
  try {

    const students =
      await getInstituteStudentsService(
        req.account.id
      );

    return res.json({
      success: true,
      data: students,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

/* BOOKINGS */
export const getInstituteBookings = async (
  req,
  res
) => {
  try {

    const bookings =
      await getInstituteBookingsService(
        req.account.id
      );

    return res.json({
      success: true,
      data: bookings,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};



/* =========================
   LIST INSTITUTES
========================= */
export const listInstitutes = async (
  req,
  res
) => {
  try {
    const result =
      await listInstitutesService(
        req.query
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


  /* =========================
   ALL INSTITUTES (ADMIN)
========================= */
export const getAllInstitutesAdmin =
  async (req, res) => {
    try {
      const institutes =
        await getAllInstitutesAdminService();

      return res.json({
        success: true,
        data: institutes,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

// /* =========================
//    PENDING INSTITUTES
// ========================= */
export const getPendingInstitutes =
  async (req, res) => {
    try {
      const institutes =
        await getAllInstitutesAdminService();

      return res.json({
        success: true,
        data: institutes.filter(
          (i) =>
            i.approval_status ===
            "PENDING"
        ),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

/* =========================
   APPROVED INSTITUTES
========================= */
export const getApprovedInstitutes =
  async (req, res) => {
    try {
      const institutes =
        await getAllInstitutesAdminService();

      return res.json({
        success: true,
        data: institutes.filter(
          (i) =>
            i.approval_status ===
            "APPROVED"
        ),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

/* =========================
   REJECTED INSTITUTES
========================= */
export const getRejectedInstitutes =
  async (req, res) => {
    try {
      const institutes =
        await getAllInstitutesAdminService();

      return res.json({
        success: true,
        data: institutes.filter(
          (i) =>
            i.approval_status ===
            "REJECTED"
        ),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };

/* =========================
   APPROVE INSTITUTE
========================= */
export const approveInstitute =
  async (req, res) => {
    try {
      const result =
        await updateInstituteApprovalService(
          req.params.id,
          "APPROVED"
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

/* =========================
   REJECT INSTITUTE
========================= */
export const rejectInstitute =
  async (req, res) => {
    try {
      const result =
        await updateInstituteApprovalService(
          req.params.id,
          "REJECTED"
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

  export const createInstituteByAdmin =
  async (req, res) => {
    try {
      const institute =
        await createInstituteService(
          req.admin?.id || 1,
          req.body
        );

      return res.status(201).json({
        success: true,
        data: institute,
      });

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: err.message,
      });

    }
};
