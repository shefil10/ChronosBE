import express from "express";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// Customer: Create order
orderRouter.post("/", protect, createOrder);

// Customer: Get my orders
orderRouter.get("/my-orders", protect, getMyOrders);

// Admin: Get all orders
orderRouter.get("/admin/all", protect, adminOnly, getAllOrders);

// Admin: Update order status
orderRouter.patch("/:id/status", protect, adminOnly, updateOrderStatus);

export default orderRouter;
