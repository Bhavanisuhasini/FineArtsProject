import * as service from "../services/trainer.service.js";
import { success } from "../utils/response.js";

export const createTrainer = async (req, res, next) => {
  try {
    const data = await service.createTrainer(req.user.id, req.body);
    success(res, data, "Trainer created (pending approval)");
  } catch (e) { next(e); }
};

export const getAllTrainers = async (req, res, next) => {
  try {
    success(res, await service.getAllTrainers());
  } catch (e) { next(e); }
};

export const getTrainerById = async (req, res, next) => {
  try {
    success(res, await service.getTrainerById(req.params.id));
  } catch (e) { next(e); }
};

export const updateTrainer = async (req, res, next) => {
  try {
    success(res, await service.updateTrainer(req.params.id, req.body));
  } catch (e) { next(e); }
};

export const uploadMedia = async (req, res, next) => {
  try {
    success(res, await service.uploadTrainerMedia(req.params.id, req.body));
  } catch (e) { next(e); }
};

export const getByInstitute = async (req, res, next) => {
  try {
    success(res, await service.getByInstitute(req.params.instituteId));
  } catch (e) { next(e); }
};

export const getByCategory = async (req, res, next) => {
  try {
    success(res, await service.getByCategory(req.params.categoryId));
  } catch (e) { next(e); }
};

export const getBySubcategory = async (req, res, next) => {
  try {
    success(res, await service.getBySubcategory(req.params.subcategoryId));
  } catch (e) { next(e); }
};

export const getMyTrainer = async (req, res, next) => {
  try {
    success(res, await service.getMyTrainer(req.user.id));
  } catch (e) { next(e); }
};

export const deleteTrainer = async (req, res, next) => {
  try {
    await service.deleteTrainer(req.params.id);
    success(res, null, "Trainer deactivated");
  } catch (e) { next(e); }
};