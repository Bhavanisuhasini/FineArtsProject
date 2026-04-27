import * as service from "../services/category.service.js";
import { success } from "../utils/response.js";

export const createCategory = async (req, res, next) => {
  try {
    const data = await service.createCategory(req.body);
    success(res, data, "Category created");
  } catch (err) {
    next(err);
  }
};

export const getAllCategories = async (req, res, next) => {
  try {
    const data = await service.getAllCategories();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const data = await service.getCategoryById(req.params.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const data = await service.updateCategory(req.params.id, req.body);
    success(res, data, "Category updated");
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id);
    success(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
};