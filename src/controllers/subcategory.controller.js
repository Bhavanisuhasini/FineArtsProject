import {
  getAllSubcategoriesService,
  getSubcategoryByIdService,
  getSubcategoriesByCategoryIdService,
  createSubcategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
} from "../services/subcategory.service.js";

export const getAllSubcategories = async (req, res) => {
  try {
    const data = await getAllSubcategoriesService();
    res.json({ success: true, message: "Subcategories fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const data = await getSubcategoryByIdService(req.params.id);

    if (!data) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    res.json({ success: true, message: "Subcategory fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubcategoriesByCategoryId = async (req, res) => {
  try {
    const data = await getSubcategoriesByCategoryIdService(req.params.categoryId);
    res.json({ success: true, message: "Subcategories by category fetched", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubcategory = async (req, res) => {
  try {
    const data = await createSubcategoryService(req.body);
    res.status(201).json({ success: true, message: "Subcategory created", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const data = await updateSubcategoryService(req.params.id, req.body);
    res.json({ success: true, message: "Subcategory updated", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    await deleteSubcategoryService(req.params.id);
    res.json({ success: true, message: "Subcategory deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};