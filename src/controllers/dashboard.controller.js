import {
  getUserDashboard,
  getTrainerDashboard,
  getInstituteDashboard,
  getAdminDashboard,
  getAdminRevenue,
  getAdminBookingsSummary,
  getAdminUsersSummary,
} from "../services/dashboard.service.js";

export const userDashboard = async (req, res) => {
  try {
    const data = await getUserDashboard(req.account.id);
    res.json({ success: true, message: "User dashboard fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const trainerDashboard = async (req, res) => {
  try {
    const data = await getTrainerDashboard(req.account.id);
    res.json({ success: true, message: "Trainer dashboard fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const instituteDashboard = async (req, res) => {
  try {
    const data = await getInstituteDashboard(req.account.id);
    res.json({ success: true, message: "Institute dashboard fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const adminDashboard = async (req, res) => {
  try {
    const data = await getAdminDashboard();
    res.json({ success: true, message: "Admin dashboard fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const adminRevenue = async (req, res) => {
  try {
    const data = await getAdminRevenue();
    res.json({ success: true, message: "Revenue fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const adminBookingsSummary = async (req, res) => {
  try {
    const data = await getAdminBookingsSummary();
    res.json({ success: true, message: "Bookings summary fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

export const adminUsersSummary = async (req, res) => {
  try {
    const data = await getAdminUsersSummary();
    res.json({ success: true, message: "Users summary fetched", data });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};