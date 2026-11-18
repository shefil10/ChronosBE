import express from "express";

import {
  createBrand,
  getAllBrands,
  getSingleBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const brandRouter = express.Router();

// CREATE BRAND
brandRouter.post("/", protect, adminOnly, upload.single("image"), createBrand);

// GET ALL BRANDS
brandRouter.get("/", getAllBrands);

// GET SINGLE BRAND
brandRouter.get("/:id", getSingleBrand);

// UPDATE BRAND
brandRouter.put(
  "/:id",
  protect,
  adminOnly,
  upload.single("image"),
  updateBrand,
);

// DELETE BRAND
brandRouter.delete("/:id", protect, adminOnly, deleteBrand);

export default brandRouter;
