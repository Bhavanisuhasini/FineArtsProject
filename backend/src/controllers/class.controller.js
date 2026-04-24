import * as service from "../services/class.service.js";
import { success } from "../utils/response.js";

export const createClass = async (req, res, next) => {
  try { success(res, await service.createClass(req.user.id, req.body), "Created"); }
  catch (e) { next(e); }
};

export const getAllClasses = async (req, res, next) => {
  try { success(res, await service.getAllClasses()); }
  catch (e) { next(e); }
};

export const getClassById = async (req, res, next) => {
  try { success(res, await service.getClassById(req.params.id)); }
  catch (e) { next(e); }
};

export const updateClass = async (req, res, next) => {
  try { success(res, await service.updateClass(req.params.id, req.body)); }
  catch (e) { next(e); }
};

export const deleteClass = async (req, res, next) => {
  try { await service.deleteClass(req.params.id); success(res, null, "Deleted"); }
  catch (e) { next(e); }
};

export const getByInstitute = async (req, res, next) => {
  try { success(res, await service.getByInstitute(req.params.instituteId)); }
  catch (e) { next(e); }
};

export const getByTrainer = async (req, res, next) => {
  try { success(res, await service.getByTrainer(req.params.trainerId)); }
  catch (e) { next(e); }
};

export const getByCategory = async (req, res, next) => {
  try { success(res, await service.getByCategory(req.params.categoryId)); }
  catch (e) { next(e); }
};

export const getBySubcategory = async (req, res, next) => {
  try { success(res, await service.getBySubcategory(req.params.subcategoryId)); }
  catch (e) { next(e); }
};

export const getMyClasses = async (req, res, next) => {
  try { success(res, await service.getMyClasses(req.user.id)); }
  catch (e) { next(e); }
};

export const addMeetingLink = async (req, res, next) => {
  try { success(res, await service.addMeetingLink(req.params.id, req.body.meeting_link)); }
  catch (e) { next(e); }
};

export const changeStatus = async (req, res, next) => {
  try { success(res, await service.changeStatus(req.params.id, req.body.status)); }
  catch (e) { next(e); }
};