import express from "express";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const productRouter = express.Router();

// Only logged-in admins can add products
productRouter.post("/", protect, adminOnly, createProduct);
// GET ALL PRODUCTS
productRouter.get("/", getAllProducts);
productRouter.get("/:id", getSingleProduct);
productRouter.put("/:id", protect, adminOnly, updateProduct);
productRouter.delete("/:id", protect, adminOnly, deleteProduct);
export default productRouter;
