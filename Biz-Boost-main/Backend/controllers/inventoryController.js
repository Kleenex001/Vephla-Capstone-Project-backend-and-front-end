// controllers/inventoryController.js
const Product = require('../models/Inventory');

// @desc    Get all products for the logged-in user
// @route   GET /api/inventory/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Get products with low stock
// @route   GET /api/inventory/low-stock
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      userId: req.user._id,
      $expr: { $lt: ['$stockLevel', '$reorderLevel'] },
      stockLevel: { $gt: 0 }
    });
    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Get products that are out of stock
// @route   GET /api/inventory/out-of-stock
const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id, stockLevel: { $lte: 0 } });
    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Get expired products
// @route   GET /api/inventory/expired
const getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();
    const products = await Product.find({ userId: req.user._id, expiryDate: { $lt: today } });
    res.status(200).json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Get notifications (low stock, out of stock, expired)
// @route   GET /api/inventory/notifications
const getNotificationProducts = async (req, res) => {
  try {
    const today = new Date();

    const lowStock = await Product.find({ 
      userId: req.user._id,
      $expr: { $lt: ['$stockLevel', '$reorderLevel'] }, 
      stockLevel: { $gt: 0 }
    });

    const outOfStock = await Product.find({ userId: req.user._id, stockLevel: { $lte: 0 } });

    const expired = await Product.find({ userId: req.user._id, expiryDate: { $lt: today } });

    res.status(200).json({
      status: 'success',
      count: lowStock.length + outOfStock.length + expired.length,
      data: {
        lowStock,
        outOfStock,
        expired
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/inventory/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

// @desc    Add a new product
// @route   POST /api/inventory/products
const addNewProduct = async (req, res) => {
  const { productName, stockLevel, reorderLevel, expiryDate, category, unitPrice } = req.body;

  if (!productName || stockLevel == null || reorderLevel == null || !expiryDate || !category || unitPrice == null) {
    return res.status(400).json({ 
      status: 'fail', 
      message: 'Please fill in all required fields.',
      body: req.body // <-- show what was sent for debugging
    });
  }

  try {
    const newProduct = new Product({ 
      productName, 
      stockLevel, 
      reorderLevel, 
      expiryDate, 
      category, 
      unitPrice,
      userId: req.user._id
    });
    const savedProduct = await newProduct.save();
    res.status(201).json({ status: 'success', data: savedProduct });
  } catch (error) {
    console.error('Error saving product:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ status: 'fail', message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ status: 'error', message: 'Error adding new product', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/inventory/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });
    res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ status: 'fail', message: 'Validation failed', errors: messages });
    }
    res.status(500).json({ status: 'error', message: 'Error updating product', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/inventory/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });
    res.status(200).json({ status: 'success', message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getExpiredProducts,
  getNotificationProducts,
  getProductById,
  addNewProduct,
  updateProduct,
  deleteProduct
};
