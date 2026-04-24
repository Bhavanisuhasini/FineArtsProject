import * as service from "../services/booking.service.js";
import { success } from "../utils/response.js";

export const createBooking = async (req, res, next) => {
  try {
    const data = await service.createBooking(req.user.id, req.body);
    success(res, data, "Booking created");
  } catch (e) { next(e); }
};

export const getMyBookings = async (req, res, next) => {
  try { success(res, await service.getMyBookings(req.user.id)); }
  catch (e) { next(e); }
};

export const getBookingById = async (req, res, next) => {
  try { success(res, await service.getBookingById(req.params.id)); }
  catch (e) { next(e); }
};

export const cancelBooking = async (req, res, next) => {
  try { success(res, await service.updateStatus(req.params.id, "CANCELLED")); }
  catch (e) { next(e); }
};

export const confirmBooking = async (req, res, next) => {
  try { success(res, await service.updateStatus(req.params.id, "CONFIRMED")); }
  catch (e) { next(e); }
};

export const completeBooking = async (req, res, next) => {
  try { success(res, await service.updateStatus(req.params.id, "COMPLETED")); }
  catch (e) { next(e); }
};

export const getByClass = async (req, res, next) => {
  try { success(res, await service.getByClass(req.params.classId)); }
  catch (e) { next(e); }
};

export const getByTrainer = async (req, res, next) => {
  try { success(res, await service.getByTrainer(req.params.trainerId)); }
  catch (e) { next(e); }
};

export const getByInstitute = async (req, res, next) => {
  try { success(res, await service.getByInstitute(req.params.instituteId)); }
  catch (e) { next(e); }
};

export const checkEligibility = async (req, res, next) => {
  try {
    const data = await service.checkEligibility(req.user.id, req.body);
    success(res, data);
  } catch (e) { next(e); }
};