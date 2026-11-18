import express from "express";

import {
  getUserProfile,
  getAllCustomers,
  getCustomerById,
} from "../controllers/userController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

// Logged-in customer profile
userRouter.get("/profile", protect, getUserProfile);

// Admin dashboard
userRouter.get("/admin-dashboard", protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CHRONOS Admin Dashboard",
    user: req.user.name,
  });
});

// Admin: Get all customers
userRouter.get("/admin/customers", protect, adminOnly, getAllCustomers);

// Admin: Get one customer and their orders
userRouter.get("/admin/customers/:id", protect, adminOnly, getCustomerById);

export default userRouter;
