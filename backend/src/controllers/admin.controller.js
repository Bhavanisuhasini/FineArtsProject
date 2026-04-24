import * as service from "../services/admin.service.js";
import { success } from "../utils/response.js";

/* Institute approvals */
export const getPendingInstitutes = async (req,res,next)=>{
  try{ success(res, await service.getPendingInstitutes()); }
  catch(e){ next(e); }
};

export const approveInstitute = async (req,res,next)=>{
  try{ success(res, await service.updateInstituteApproval(req.params.id,"APPROVED")); }
  catch(e){ next(e); }
};

export const rejectInstitute = async (req,res,next)=>{
  try{ success(res, await service.updateInstituteApproval(req.params.id,"REJECTED")); }
  catch(e){ next(e); }
};

/* Trainer approvals */
export const getPendingTrainers = async (req,res,next)=>{
  try{ success(res, await service.getPendingTrainers()); }
  catch(e){ next(e); }
};

export const approveTrainer = async (req,res,next)=>{
  try{ success(res, await service.updateTrainerApproval(req.params.id,"APPROVED")); }
  catch(e){ next(e); }
};

export const rejectTrainer = async (req,res,next)=>{
  try{ success(res, await service.updateTrainerApproval(req.params.id,"REJECTED")); }
  catch(e){ next(e); }
};

/* Users */
export const getUsers = async (req,res,next)=>{
  try{ success(res, await service.getAllUsers()); }
  catch(e){ next(e); }
};

export const getUser = async (req,res,next)=>{
  try{ success(res, await service.getUserById(req.params.id)); }
  catch(e){ next(e); }
};

export const updateUserStatus = async (req,res,next)=>{
  try{ success(res, await service.updateUserStatus(req.params.id, req.body.status)); }
  catch(e){ next(e); }
};

/* Generic */
export const getAll = (fn) => async (req,res,next)=>{
  try{ success(res, await fn()); }
  catch(e){ next(e); }
};

export const getById = (fn) => async (req,res,next)=>{
  try{ success(res, await fn(req.params.id)); }
  catch(e){ next(e); }
};

export const updateStatus = (fn) => async (req,res,next)=>{
  try{ success(res, await fn(req.params.id, req.body.status)); }
  catch(e){ next(e); }
};