import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      trim: true,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    options: [
      {
        name: {
          type: String,
          trim: true,
        },
        value: {
          type: String,
          trim: true,
        },
      },
    ],

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
    },

    imagePublicId: {
      type: String,
    },

    // Keep existing size support
    size: {
      type: [String],
      default: [],
    },

    // NEW: Product variants
    variants: {
      type: [variantSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
