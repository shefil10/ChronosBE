import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";

// ------------------------------
// PARSE SIZES
// ------------------------------
const parseSizes = (size) => {
  if (!size) return [];

  let sizes = size;

  if (typeof sizes === "string") {
    try {
      sizes = JSON.parse(sizes);
    } catch {
      sizes = sizes.split(",");
    }
  }

  if (!Array.isArray(sizes)) {
    throw new Error("Sizes must be an array");
  }

  return [
    ...new Set(
      sizes.map((item) => String(item).trim().toUpperCase()).filter(Boolean),
    ),
  ];
};

// ------------------------------
// PARSE VARIANTS
// ------------------------------
const parseVariants = (variants) => {
  if (!variants) return [];

  const parsed = typeof variants === "string" ? JSON.parse(variants) : variants;

  if (!Array.isArray(parsed)) {
    throw new Error("Variants must be an array");
  }

  return parsed.map((variant) => {
    if (!variant.sku?.trim()) {
      throw new Error("Every variant must have a SKU");
    }

    const stock = Number(variant.stock);

    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("Variant stock must be a valid non-negative integer");
    }

    const options = (variant.options || []).map((option) => ({
      name: String(option.name || "").trim(),
      value: String(option.value || "").trim(),
    }));

    if (options.some((option) => !option.name || !option.value)) {
      throw new Error("Every variant option needs a name and value");
    }

    return {
      sku: variant.sku.trim(),
      stock,
      options,
    };
  });
};

// ------------------------------
// CLOUDINARY IMAGE UPLOAD
// ------------------------------
const uploadProductImage = async (file) => {
  const base64Image =
    `data:${file.mimetype};base64,` + file.buffer.toString("base64");

  return cloudinary.uploader.upload(base64Image, {
    folder: "chronos-products",
    resource_type: "image",
  });
};

// ------------------------------
// FIND UPLOADED FILES
// ------------------------------
const getFile = (req, fieldName) => {
  return req.files?.find((file) => file.fieldname === fieldName);
};

const getVariantFiles = (req, index) => {
  return (req.files || []).filter(
    (file) => file.fieldname === `variantImages_${index}`,
  );
};

// ------------------------------
// CLOUDINARY CLEANUP
// ------------------------------
const deleteCloudinaryImages = async (publicIds) => {
  for (const publicId of publicIds) {
    if (!publicId) continue;

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary cleanup error:", error);
    }
  }
};

// ==============================
// CREATE PRODUCT
// ==============================
export const createProduct = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const {
      productName,
      name,
      description,
      price,
      brand,
      category,
      stock,
      size,
      variants,
    } = req.body;

    const finalName = productName || name;

    if (
      !finalName?.trim() ||
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

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid price",
      });
    }

    if (
      stock !== undefined &&
      stock !== "" &&
      (!Number.isInteger(Number(stock)) || Number(stock) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid stock",
      });
    }

    const mainImage = getFile(req, "image");

    if (!mainImage) {
      return res.status(400).json({
        success: false,
        message: "Please select a product image",
      });
    }

    const sizes = parseSizes(size);
    const parsedVariants = parseVariants(variants);

    // Upload main image
    const uploadedImage = await uploadProductImage(mainImage);
    uploadedPublicIds.push(uploadedImage.public_id);

    // Upload each variant's images
    const finalVariants = [];

    for (let i = 0; i < parsedVariants.length; i++) {
      const variant = parsedVariants[i];
      const variantFiles = getVariantFiles(req, i);

      const variantImages = [];

      for (const file of variantFiles) {
        const uploaded = await uploadProductImage(file);

        uploadedPublicIds.push(uploaded.public_id);

        variantImages.push({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
        });
      }

      finalVariants.push({
        ...variant,
        images: variantImages,
      });
    }

    const product = await Product.create({
      name: finalName.trim(),
      description: description.trim(),
      price: Number(price),
      image: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
      brand: brand.trim(),
      category,
      stock: Number(stock) || 0,
      size: sizes,
      variants: finalVariants,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Product creation error:", error);

    await deleteCloudinaryImages(uploadedPublicIds);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET ALL PRODUCTS
// ==============================
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

// ==============================
// GET SINGLE PRODUCT
// ==============================
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

// ==============================
// UPDATE PRODUCT
// ==============================
export const updateProduct = async (req, res) => {
  const uploadedPublicIds = [];

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      productName,
      name,
      description,
      price,
      brand,
      category,
      stock,
      size,
      variants,
    } = req.body;

    if (productName !== undefined || name !== undefined) {
      product.name = (productName ?? name).trim();
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (price !== undefined && price !== "") {
      if (!Number.isFinite(Number(price)) || Number(price) < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid price",
        });
      }

      product.price = Number(price);
    }

    if (brand !== undefined) product.brand = brand.trim();
    if (category !== undefined) product.category = category;

    if (stock !== undefined && stock !== "") {
      if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter valid stock",
        });
      }

      product.stock = Number(stock);
    }

    if (size !== undefined) {
      product.size = parseSizes(size);
    }

    // Replace main image when a new image is uploaded
    const oldPublicIds = [];

    const mainImage = getFile(req, "image");

    if (mainImage) {
      const uploaded = await uploadProductImage(mainImage);

      uploadedPublicIds.push(uploaded.public_id);

      if (product.imagePublicId) {
        oldPublicIds.push(product.imagePublicId);
      }

      product.image = uploaded.secure_url;
      product.imagePublicId = uploaded.public_id;
    }

    // Update variants only when variants are provided
    if (variants !== undefined) {
      const parsedVariants = parseVariants(variants);

      // Preserve existing variant images by SKU
      const oldVariants = product.variants;
      const finalVariants = [];

      for (let i = 0; i < parsedVariants.length; i++) {
        const variant = parsedVariants[i];

        const existingVariant = oldVariants.find(
          (old) => old.sku === variant.sku,
        );

        const variantFiles = getVariantFiles(req, i);
        let variantImages = existingVariant
          ? existingVariant.images.map((img) => ({
              url: img.url,
              publicId: img.publicId,
            }))
          : [];

        // If new images are uploaded, replace previous images
        if (variantFiles.length > 0) {
          variantImages = [];

          for (const file of variantFiles) {
            const uploaded = await uploadProductImage(file);

            uploadedPublicIds.push(uploaded.public_id);

            variantImages.push({
              url: uploaded.secure_url,
              publicId: uploaded.public_id,
            });
          }

          existingVariant?.images.forEach((img) => {
            if (img.publicId) oldPublicIds.push(img.publicId);
          });
        }

        finalVariants.push({
          ...variant,
          images: variantImages,
        });
      }

      // Remove images belonging to deleted variants
      oldVariants.forEach((old) => {
        const stillExists = finalVariants.some(
          (variant) => variant.sku === old.sku,
        );

        if (!stillExists) {
          old.images.forEach((img) => {
            if (img.publicId) oldPublicIds.push(img.publicId);
          });
        }
      });

      product.variants = finalVariants;
    }

    await product.save();

    // Delete old images after successful database save
    await deleteCloudinaryImages(oldPublicIds);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Product update error:", error);

    await deleteCloudinaryImages(uploadedPublicIds);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// DELETE PRODUCT
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const publicIds = [];

    if (product.imagePublicId) {
      publicIds.push(product.imagePublicId);
    }

    product.variants.forEach((variant) => {
      variant.images.forEach((img) => {
        if (img.publicId) publicIds.push(img.publicId);
      });
    });

    await Product.findByIdAndDelete(req.params.id);

    await deleteCloudinaryImages(publicIds);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Product deletion error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
