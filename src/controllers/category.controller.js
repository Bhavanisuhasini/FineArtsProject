<<<<<<< HEAD
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
=======
import {
  getAllCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "../services/category.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await getAllCategoriesService();

    return successResponse(
      res,
      "Categories fetched successfully",
      categories,
      200
    );
  } catch (error) {
    console.error("getAllCategories error:", error.message);
    return errorResponse(res, "Failed to fetch categories", error.message, 500);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await getCategoryByIdService(id);

    if (!category) {
      return errorResponse(res, "Category not found", null, 404);
    }

    return successResponse(
      res,
      "Category fetched successfully",
      category,
      200
    );
  } catch (error) {
    console.error("getCategoryById error:", error.message);
    return errorResponse(res, "Failed to fetch category", error.message, 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, "Category name is required", null, 400);
    }

    const createdCategory = await createCategoryService({
      name: name.trim(),
      description,
      image_url,
    });

    return successResponse(
      res,
      "Category created successfully",
      createdCategory,
      201
    );
  } catch (error) {
    console.error("createCategory error:", error.message);

    if (error.message === "Category already exists") {
      return errorResponse(res, error.message, null, 409);
    }

    return errorResponse(res, "Failed to create category", error.message, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, is_active } = req.body;

    const updatedCategory = await updateCategoryService(id, {
      name: name?.trim(),
      description,
      image_url,
      is_active,
    });

    return successResponse(
      res,
      "Category updated successfully",
      updatedCategory,
      200
    );
  } catch (error) {
    console.error("updateCategory error:", error.message);

    if (error.message === "Category not found") {
      return errorResponse(res, error.message, null, 404);
    }

    if (error.message === "Another category with this name already exists") {
      return errorResponse(res, error.message, null, 409);
    }

    return errorResponse(res, "Failed to update category", error.message, 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteCategoryService(id);

    return successResponse(res, "Category deleted successfully", null, 200);
  } catch (error) {
    console.error("deleteCategory error:", error.message);

    if (error.message === "Category not found") {
      return errorResponse(res, error.message, null, 404);
    }

    return errorResponse(res, "Failed to delete category", error.message, 500);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};