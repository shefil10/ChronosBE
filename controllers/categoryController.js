import Category from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  let uploadedImage = null;

  try {
    const { name, description } = req.body;

    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide category name and description",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a category image",
      });
    }

    // Check duplicate category
    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Upload image to Cloudinary
    const base64Image =
      `data:${req.file.mimetype};base64,` + req.file.buffer.toString("base64");

    uploadedImage = await cloudinary.uploader.upload(base64Image, {
      folder: "chronos-categories",
      resource_type: "image",
    });

    // Save category in MongoDB
    const category = await Category.create({
      name: name.trim(),
      description: description.trim(),
      image: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    // Cleanup uploaded image if saving fails
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

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE CATEGORY
export const getSingleCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  let uploadedImage = null;

  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check duplicate name
    if (name?.trim() && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        name: name.trim(),
        _id: { $ne: category._id },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }

      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (isActive !== undefined) {
      category.isActive = isActive === "true" || isActive === true;
    }

    // Upload new image only if one is selected
    if (req.file) {
      const base64Image =
        `data:${req.file.mimetype};base64,` +
        req.file.buffer.toString("base64");

      uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "chronos-categories",
        resource_type: "image",
      });

      category.image = uploadedImage.secure_url;
      category.imagePublicId = uploadedImage.public_id;
    }

    await category.save();

    // Delete old image after successful update
    if (uploadedImage && category.imagePublicId) {
      const oldPublicId = category._previousImagePublicId;
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);

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

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    // Delete image from Cloudinary
    if (category.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(category.imagePublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
