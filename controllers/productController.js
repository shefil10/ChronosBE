import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  let uploadedImage = null;

  try {
    const { productName, description, price, brand, category, stock, size } =
      req.body;

    // Check required fields
    if (
      !productName?.trim() ||
      !description?.trim() ||
      price === undefined ||
      price === "" ||
      !brand?.trim() ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }
    console.log("Image received:", req.file);
    console.log("Product details:", req.body);

    // Check image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a product image",
      });
    }

    console.log("Received image:", req.file.originalname);

    // Upload image to Cloudinary
    const base64Image =
      `data:${req.file.mimetype};base64,` + req.file.buffer.toString("base64");

    uploadedImage = await cloudinary.uploader.upload(base64Image, {
      folder: "chronos-products",
      resource_type: "image",
    });

    console.log("Cloudinary upload successful");

    // Convert sizes into an array
    let sizes = [];

    if (size) {
      sizes = JSON.parse(size);
    }

    // Save product in MongoDB
    const product = await Product.create({
      name: productName.trim(),
      description: description.trim(),
      price: Number(price),
      image: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
      brand: brand.trim(),
      category,
      stock: Number(stock) || 0,
      size: sizes,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Product creation error:", error);

    // Remove Cloudinary image if MongoDB saving fails
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE PRODUCT
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete image from Cloudinary
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
