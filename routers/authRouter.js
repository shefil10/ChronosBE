import express from "express";

import { registerUser, loginUser } from "../controllers/authController.js";

const authRouter = express.Router();

// Registration API
authRouter.post("/register", registerUser);

// Login API
authRouter.post("/login", loginUser);

export default authRouter;
