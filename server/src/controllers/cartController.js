const { Cart } = require("../models/Cart");
const { Product } = require("../models/Product");

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    return res.status(200).json({ success: true, data: { items: cart.items || [], ...cart.toObject() } });
  } catch (err) {
    return next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "Product ID is required" });

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found or inactive" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(it => it.product.toString() === productId);
    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
         return res.status(400).json({ success: false, message: "Insufficient stock for combined quantity" });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({ success: true, message: "Added to cart", data: { items: cart.items || [], ...cart.toObject() } });
  } catch (err) {
    return next(err);
  }
};

const updateQuantity = async (req, res, next) => {
  try {
    const { id } = req.params; // Cart item ID or Product ID
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(it => it._id?.toString() === id || it.product.toString() === id);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found in cart" });

    const product = await Product.findById(cart.items[itemIndex].product);
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({ success: true, message: "Quantity updated", data: { items: cart.items || [], ...cart.toObject() } });
  } catch (err) {
    return next(err);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter(it => it._id?.toString() !== id && it.product.toString() !== id);
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({ success: true, message: "Item removed", data: { items: cart.items || [], ...cart.toObject() } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem
};
