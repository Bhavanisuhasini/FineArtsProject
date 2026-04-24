import * as service from "../services/subcategory.service.js";
import { success } from "../utils/response.js";

export const createSubcategory = async (req, res, next) => {
  try {
    const data = await service.createSubcategory(req.body);
    success(res, data, "Subcategory created");
  } catch (err) {
    next(err);
  }
};

export const getAllSubcategories = async (req, res, next) => {
  try {
    const data = await service.getAllSubcategories();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getSubcategoryById = async (req, res, next) => {
  try {
    const data = await service.getSubcategoryById(req.params.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getSubcategoriesByCategory = async (req, res, next) => {
  try {
    const data = await service.getSubcategoriesByCategory(req.params.categoryId);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const updateSubcategory = async (req, res, next) => {
  try {
    const data = await service.updateSubcategory(req.params.id, req.body);
    success(res, data, "Subcategory updated");
  } catch (err) {
    next(err);
  }
};

export const deleteSubcategory = async (req, res, next) => {
  try {
    await service.deleteSubcategory(req.params.id);
    success(res, null, "Subcategory deleted");
  } catch (err) {
    next(err);
  }
};