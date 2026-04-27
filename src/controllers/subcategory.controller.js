import {
  getAllSubcategoriesService,
  getSubcategoryByIdService,
  getSubcategoriesByCategoryIdService,
  createSubcategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
} from "../services/subcategory.service.js";
<<<<<<< HEAD

export const getAllSubcategories = async (req, res) => {
  try {
    const data = await getAllSubcategoriesService();
    res.json({ success: true, message: "Subcategories fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
=======
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
    console.error("getAllSubcategories error:", error.message);
    return errorResponse(res, "Failed to fetch subcategories", error.message, 500);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
<<<<<<< HEAD
    const data = await getSubcategoryByIdService(req.params.id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    res.json({ success: true, message: "Subcategory fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
=======
    const { id } = req.params;

    const subcategory = await getSubcategoryByIdService(id);

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
    console.error("getSubcategoryById error:", error.message);
    return errorResponse(res, "Failed to fetch subcategory", error.message, 500);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};

export const getSubcategoriesByCategoryId = async (req, res) => {
  try {
<<<<<<< HEAD
    const data = await getSubcategoriesByCategoryIdService(req.params.categoryId);
    res.json({ success: true, message: "Subcategories by category fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
=======
    const { categoryId } = req.params;

    const subcategories = await getSubcategoriesByCategoryIdService(categoryId);

    return successResponse(
      res,
      "Subcategories by category fetched successfully",
      subcategories,
      200
    );
  } catch (error) {
    console.error("getSubcategoriesByCategoryId error:", error.message);
    return errorResponse(
      res,
      "Failed to fetch subcategories by category",
      error.message,
      500
    );
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};

export const createSubcategory = async (req, res) => {
  try {
<<<<<<< HEAD
    const data = await createSubcategoryService(req.body);
    res.status(201).json({ success: true, message: "Subcategory created", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
=======
    const { category_id, name, description, image_url } = req.body;

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
      image_url,
    });

    return successResponse(
      res,
      "Subcategory created successfully",
      createdSubcategory,
      201
    );
  } catch (error) {
    console.error("createSubcategory error:", error.message);

    if (
      error.message === "Category not found" ||
      error.message === "Subcategory already exists under this category"
    ) {
      return errorResponse(res, error.message, null, 400);
    }

    return errorResponse(res, "Failed to create subcategory", error.message, 500);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};

export const updateSubcategory = async (req, res) => {
  try {
<<<<<<< HEAD
    const data = await updateSubcategoryService(req.params.id, req.body);
    res.json({ success: true, message: "Subcategory updated", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
=======
    const { id } = req.params;
    const { category_id, name, description, image_url, is_active } = req.body;

    const updatedSubcategory = await updateSubcategoryService(id, {
      category_id,
      name: name?.trim(),
      description,
      image_url,
      is_active,
    });

    return successResponse(
      res,
      "Subcategory updated successfully",
      updatedSubcategory,
      200
    );
  } catch (error) {
    console.error("updateSubcategory error:", error.message);

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
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
<<<<<<< HEAD
    await deleteSubcategoryService(req.params.id);
    res.json({ success: true, message: "Subcategory deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
=======
    const { id } = req.params;

    await deleteSubcategoryService(id);

    return successResponse(res, "Subcategory deleted successfully", null, 200);
  } catch (error) {
    console.error("deleteSubcategory error:", error.message);

    if (error.message === "Subcategory not found") {
      return errorResponse(res, error.message, null, 404);
    }

    return errorResponse(res, "Failed to delete subcategory", error.message, 500);
>>>>>>> fbc6bb9d95aea3274d175f3a93127200a57e1dd2
  }
};