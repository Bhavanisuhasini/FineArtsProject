import * as service from "../services/payment.service.js";
import { success } from "../utils/response.js";

export const createOrder = async (req, res, next) => {
  try {
    success(res, await service.createOrder(req.user.id, req.body));
  } catch (e) { next(e); }
};

export const verifyPayment = async (req, res, next) => {
  try {
    success(res, await service.verifyPayment(req.body));
  } catch (e) { next(e); }
};

export const savePayment = async (req, res, next) => {
  try {
    success(res, await service.savePayment(req.user.id, req.body));
  } catch (e) { next(e); }
};

export const getByBooking = async (req, res, next) => {
  try {
    success(res, await service.getByBooking(req.params.bookingId));
  } catch (e) { next(e); }
};

export const getMyPayments = async (req, res, next) => {
  try {
    success(res, await service.getMyPayments(req.user.id));
  } catch (e) { next(e); }
};

export const refundPayment = async (req, res, next) => {
  try {
    success(res, await service.refundPayment(req.params.id));
  } catch (e) { next(e); }
};

export const webhook = async (req, res, next) => {
  try {
    const data = await service.webhookHandler(req.body);
    res.status(200).json(data);
  } catch (e) { next(e); }
};