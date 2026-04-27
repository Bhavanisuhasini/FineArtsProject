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
    return errorResponse(res, "Failed to fetch categories", error.message, 500);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await getCategoryByIdService(req.params.id);

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
    return errorResponse(res, "Failed to fetch category", error.message, 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description, image, image_url } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, "Category name is required", null, 400);
    }

    const createdCategory = await createCategoryService({
      name: name.trim(),
      description,
      image: image || image_url || null,
    });

    return successResponse(
      res,
      "Category created successfully",
      createdCategory,
      201
    );
  } catch (error) {
    if (error.message === "Category already exists") {
      return errorResponse(res, error.message, null, 409);
    }

    return errorResponse(res, "Failed to create category", error.message, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, description, image, image_url, is_active } = req.body;

    const updatedCategory = await updateCategoryService(req.params.id, {
      name: name?.trim(),
      description,
      image: image || image_url || null,
      is_active,
    });

    return successResponse(
      res,
      "Category updated successfully",
      updatedCategory,
      200
    );
  } catch (error) {
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
    await deleteCategoryService(req.params.id);

    return successResponse(res, "Category deleted successfully", null, 200);
  } catch (error) {
    if (error.message === "Category not found") {
      return errorResponse(res, error.message, null, 404);
    }

    return errorResponse(res, "Failed to delete category", error.message, 500);
  }
};