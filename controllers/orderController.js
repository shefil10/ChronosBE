import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { products, shippingAddress } = req.body;

    if (!Array.isArray(products) || products.length === 0 || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Products and shipping address are required",
      });
    }

    let totalAmount = 0;
    const orderProducts = [];
    const stockRequirements = {};

    // Validate products and calculate stock requirements
    for (const item of products) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required",
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const selectedSize = String(item.size || "").trim();

      // Validate size if the product has available sizes
      const availableSizes = Array.isArray(product.size) ? product.size : [];

      if (availableSizes.length > 0) {
        if (!selectedSize) {
          return res.status(400).json({
            success: false,
            message: `Please select a size for ${product.name}`,
          });
        }

        if (!availableSizes.includes(selectedSize)) {
          return res.status(400).json({
            success: false,
            message: `Invalid size selected for ${product.name}`,
          });
        }
      }

      // Check total stock for the same product across sizes
      const productId = product._id.toString();

      stockRequirements[productId] =
        (stockRequirements[productId] || 0) + quantity;

      totalAmount += product.price * quantity;

      orderProducts.push({
        product: product._id,
        quantity,
        size: selectedSize,
      });
    }

    // Verify available stock before creating the order
    for (const [productId, requiredQuantity] of Object.entries(
      stockRequirements,
    )) {
      const product = await Product.findById(productId);

      if (!product || product.stock < requiredQuantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product?.name || "product"}`,
        });
      }
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress,
    });

    // Reduce product stock
    for (const [productId, quantity] of Object.entries(stockRequirements)) {
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET MY ORDERS
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL ORDERS (ADMIN)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ORDER STATUS (ADMIN)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
