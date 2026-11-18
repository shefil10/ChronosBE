import Brand from "../models/brandModel.js";
import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";

// CREATE BRAND
export const createBrand = async (req, res) => {
  let uploadedImage = null;

  try {
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide brand name",
      });
    }

    // Check duplicate brand
    const existingBrand = await Brand.findOne({
      name: name.trim(),
    });

    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: "Brand already exists",
      });
    }

    let image = "";
    let imagePublicId = "";

    // Upload brand logo if provided
    if (req.file) {
      const base64Image =
        `data:${req.file.mimetype};base64,` +
        req.file.buffer.toString("base64");

      uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "chronos-brands",
        resource_type: "image",
      });

      image = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
    }

    const brand = await Brand.create({
      name: name.trim(),
      description: description?.trim() || "",
      image,
      imagePublicId,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    console.error("Create brand error:", error);

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

// GET ALL BRANDS
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE BRAND
export const getSingleBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE BRAND
export const updateBrand = async (req, res) => {
  let uploadedImage = null;

  try {
    const { name, description, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const oldName = brand.name;
    const oldImagePublicId = brand.imagePublicId;

    // Check duplicate brand name
    if (name?.trim() && name.trim() !== oldName) {
      const existingBrand = await Brand.findOne({
        name: name.trim(),
        _id: { $ne: brand._id },
      });

      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Brand name already exists",
        });
      }

      brand.name = name.trim();
    }

    if (description !== undefined) {
      brand.description = description.trim();
    }

    if (isActive !== undefined) {
      brand.isActive = isActive === "true" || isActive === true;
    }

    // Upload new logo if selected
    if (req.file) {
      const base64Image =
        `data:${req.file.mimetype};base64,` +
        req.file.buffer.toString("base64");

      uploadedImage = await cloudinary.uploader.upload(base64Image, {
        folder: "chronos-brands",
        resource_type: "image",
      });

      brand.image = uploadedImage.secure_url;
      brand.imagePublicId = uploadedImage.public_id;
    }

    await brand.save();

    // Update existing products if brand name changes
    if (oldName !== brand.name) {
      await Product.updateMany(
        { brand: oldName },
        { $set: { brand: brand.name } },
      );
    }

    // Delete previous logo after successful update
    if (uploadedImage && oldImagePublicId) {
      try {
        await cloudinary.uploader.destroy(oldImagePublicId);
      } catch (cloudinaryError) {
        console.error("Old brand logo deletion error:", cloudinaryError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    console.error("Update brand error:", error);

    // Remove newly uploaded image if update fails
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

// DELETE BRAND
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Prevent deletion if products use this brand
    const existingProduct = await Product.findOne({
      brand: brand.name,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message:
          "This brand is assigned to products. Please update those products before deleting the brand.",
      });
    }

    await Brand.findByIdAndDelete(req.params.id);

    // Delete logo from Cloudinary
    if (brand.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(brand.imagePublicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Delete brand error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
