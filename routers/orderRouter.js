import express from "express";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

import {
  createOrder,
  getMyOrders,
  getAllOrders,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Create order
orderRouter.post("/", protect, createOrder);

// Get logged-in user's orders
orderRouter.get("/my-orders", protect, getMyOrders);

// Admin: Get all orders
orderRouter.get("/admin/all", protect, adminOnly, getAllOrders);

export default orderRouter;
