import * as service from "../services/booking.service.js";

const ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, e, status = 400) =>
  res.status(status).json({ success: false, message: e.message });

export const createBooking = async (req, res) => {
  try {
    const data = await service.createBooking(req.account.id, req.body);
    ok(res, data, "Booking created", 201);
  } catch (e) { fail(res, e); }
};

export const getMyBookings = async (req, res) => {
  try { ok(res, await service.getMyBookings(req.account.id)); }
  catch (e) { fail(res, e); }
};

export const getBookingById = async (req, res) => {
  try { ok(res, await service.getBookingById(req.params.id)); }
  catch (e) { fail(res, e, 404); }
};

export const cancelBooking = async (req, res) => {
  try { ok(res, await service.updateStatus(req.params.id, "CANCELLED")); }
  catch (e) { fail(res, e); }
};

export const confirmBooking = async (req, res) => {
  try { ok(res, await service.updateStatus(req.params.id, "CONFIRMED")); }
  catch (e) { fail(res, e); }
};

export const completeBooking = async (req, res) => {
  try { ok(res, await service.updateStatus(req.params.id, "COMPLETED")); }
  catch (e) { fail(res, e); }
};

export const getByClass = async (req, res) => {
  try { ok(res, await service.getByClass(req.params.classId)); }
  catch (e) { fail(res, e); }
};

export const getByTrainer = async (req, res) => {
  try { ok(res, await service.getByTrainer(req.params.trainerId)); }
  catch (e) { fail(res, e); }
};

export const getByInstitute = async (req, res) => {
  try { ok(res, await service.getByInstitute(req.params.instituteId)); }
  catch (e) { fail(res, e); }
};

export const checkEligibility = async (req, res) => {
  try {
    const data = await service.checkEligibility(req.account.id, req.body);
    ok(res, data);
  } catch (e) { fail(res, e); }
};
