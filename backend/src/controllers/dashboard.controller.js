import * as service from "../services/dashboard.service.js";
import { success } from "../utils/response.js";

export const userDashboard = async (req,res,next)=>{
  try { success(res, await service.userDashboard(req.user.id)); }
  catch(e){ next(e); }
};

export const trainerDashboard = async (req,res,next)=>{
  try { success(res, await service.trainerDashboard(req.user.id)); }
  catch(e){ next(e); }
};

export const instituteDashboard = async (req,res,next)=>{
  try { success(res, await service.instituteDashboard(req.user.id)); }
  catch(e){ next(e); }
};

export const adminDashboard = async (req,res,next)=>{
  try { success(res, await service.adminDashboard()); }
  catch(e){ next(e); }
};

export const revenueReport = async (req,res,next)=>{
  try { success(res, await service.revenueReport()); }
  catch(e){ next(e); }
};

export const bookingSummary = async (req,res,next)=>{
  try { success(res, await service.bookingSummary()); }
  catch(e){ next(e); }
};

export const userSummary = async (req,res,next)=>{
  try { success(res, await service.userSummary()); }
  catch(e){ next(e); }
};