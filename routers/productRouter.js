import express from "express";

import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const productRouter = express.Router();

// CREATE PRODUCT WITH MULTIPLE IMAGES
productRouter.post("/", protect, adminOnly, upload.any(), createProduct);

// GET ALL PRODUCTS
productRouter.get("/", getAllProducts);

// GET SINGLE PRODUCT
productRouter.get("/:id", getSingleProduct);

// UPDATE PRODUCT WITH MULTIPLE IMAGES
productRouter.put("/:id", protect, adminOnly, upload.any(), updateProduct);

// DELETE PRODUCT
productRouter.delete("/:id", protect, adminOnly, deleteProduct);

export default productRouter;
