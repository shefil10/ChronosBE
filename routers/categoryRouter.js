import express from "express";

import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const categoryRouter = express.Router();

// Admin: Create category
categoryRouter.post("/", protect, adminOnly, createCategory);

// Get all categories
categoryRouter.get("/", getAllCategories);

// Get single category
categoryRouter.get("/:id", getSingleCategory);

// Admin: Update category
categoryRouter.put("/:id", protect, adminOnly, updateCategory);

// Admin: Delete category
categoryRouter.delete("/:id", protect, adminOnly, deleteCategory);

export default categoryRouter;
