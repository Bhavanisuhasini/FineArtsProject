import * as service from "../services/institute.service.js";
import { success } from "../utils/response.js";

export const createInstitute = async (req, res, next) => {
  try {
    const data = await service.createInstitute(req.user.id, req.body);
    success(res, data, "Institute created");
  } catch (e) { next(e); }
};

export const getAllInstitutes = async (req, res, next) => {
  try {
    const data = await service.getAllInstitutes();
    success(res, data);
  } catch (e) { next(e); }
};

export const getInstituteById = async (req, res, next) => {
  try {
    const data = await service.getInstituteById(req.params.id);
    success(res, data);
  } catch (e) { next(e); }
};

export const updateInstitute = async (req, res, next) => {
  try {
    const data = await service.updateInstitute(req.params.id, req.body);
    success(res, data, "Updated");
  } catch (e) { next(e); }
};

export const uploadMedia = async (req, res, next) => {
  try {
    const data = await service.uploadMedia(req.params.id, req.body);
    success(res, data, "Uploaded");
  } catch (e) { next(e); }
};

export const getMyInstitute = async (req, res, next) => {
  try {
    const data = await service.getMyInstitute(req.user.id);
    success(res, data);
  } catch (e) { next(e); }
};

export const getByCategory = async (req, res, next) => {
  try {
    const data = await service.getByCategory(req.params.categoryId);
    success(res, data);
  } catch (e) { next(e); }
};

export const filterInstitutes = async (req, res, next) => {
  try {
    const data = await service.filterInstitutes(req.query);
    success(res, data);
  } catch (e) { next(e); }
};

export const deleteInstitute = async (req, res, next) => {
  try {
    await service.deleteInstitute(req.params.id);
    success(res, null, "Deactivated");
  } catch (e) { next(e); }
};