import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
const userRouter = express.Router();

userRouter.get("/admin-dashboard", protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to CHRONOS Admin Dashboard",
    user: req.user.name,
  });
});

export default userRouter;
