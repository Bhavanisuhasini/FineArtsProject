import {
  getAllSubcategoriesService,
  getSubcategoryByIdService,
  getSubcategoriesByCategoryIdService,
  createSubcategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
} from "../services/subcategory.service.js";

import { successResponse, errorResponse } from "../utils/response.js";

export const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await getAllSubcategoriesService();

    return successResponse(
      res,
      "Subcategories fetched successfully",
      subcategories,
      200
    );
  } catch (error) {
    return errorResponse(res, "Failed to fetch subcategories", error.message, 500);
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await getSubcategoryByIdService(req.params.id);

    if (!subcategory) {
      return errorResponse(res, "Subcategory not found", null, 404);
    }

    return successResponse(
      res,
      "Subcategory fetched successfully",
      subcategory,
      200
    );
  } catch (error) {
    return errorResponse(res, "Failed to fetch subcategory", error.message, 500);
  }
};

export const getSubcategoriesByCategoryId = async (req, res) => {
  try {
    const subcategories = await getSubcategoriesByCategoryIdService(
      req.params.categoryId
    );

    return successResponse(
      res,
      "Subcategories by category fetched successfully",
      subcategories,
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch subcategories by category",
      error.message,
      500
    );
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const { category_id, name, description, image, image_url } = req.body;

    if (!category_id) {
      return errorResponse(res, "category_id is required", null, 400);
    }

    if (!name || !name.trim()) {
      return errorResponse(res, "Subcategory name is required", null, 400);
    }

    const createdSubcategory = await createSubcategoryService({
      category_id,
      name: name.trim(),
      description,
      image: image || image_url || null,
    });

    return successResponse(
      res,
      "Subcategory created successfully",
      createdSubcategory,
      201
    );
  } catch (error) {
    if (
      error.message === "Category not found" ||
      error.message === "Subcategory already exists under this category"
    ) {
      return errorResponse(res, error.message, null, 400);
    }

    return errorResponse(res, "Failed to create subcategory", error.message, 500);
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const { category_id, name, description, image, image_url, is_active } = req.body;

    const updatedSubcategory = await updateSubcategoryService(req.params.id, {
      category_id,
      name: name?.trim(),
      description,
      image: image || image_url || null,
      is_active,
    });

    return successResponse(
      res,
      "Subcategory updated successfully",
      updatedSubcategory,
      200
    );
  } catch (error) {
    if (
      error.message === "Subcategory not found" ||
      error.message === "Category not found"
    ) {
      return errorResponse(res, error.message, null, 404);
    }

    if (
      error.message ===
      "Another subcategory with this name already exists under this category"
    ) {
      return errorResponse(res, error.message, null, 409);
    }

    return errorResponse(res, "Failed to update subcategory", error.message, 500);
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    await deleteSubcategoryService(req.params.id);

    return successResponse(res, "Subcategory deleted successfully", null, 200);
  } catch (error) {
    if (error.message === "Subcategory not found") {
      return errorResponse(res, error.message, null, 404);
    }

    return errorResponse(res, "Failed to delete subcategory", error.message, 500);
  }
};