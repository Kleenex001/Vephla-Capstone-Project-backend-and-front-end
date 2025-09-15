const Product = require('../models/Inventory');

// @desc    Get all products
// @route   GET /api/inventory/products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get products with low stock
// @route   GET /api/inventory/low-stock
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ $expr: { $lt: ['$stockLevel', '$reorderLevel'] } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get expired products
// @route   GET /api/inventory/expired
const getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();
    const products = await Product.find({ expiryDate: { $lt: today } });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/inventory/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Add a new product
// @route   POST /api/inventory/products
const addNewProduct = async (req, res) => {
  const { productName, stockLevel, reorderLevel, expiryDate, category, unitPrice } = req.body;

  if (!productName || stockLevel == null || reorderLevel == null || !category || unitPrice == null) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    const newProduct = new Product({ productName, stockLevel, reorderLevel, expiryDate, category, unitPrice });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error adding new product', error });
  }
};


// @desc    Update a product
// @route   PUT /api/inventory/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error });
  }
};

// @desc    Delete a product
// @route   DELETE /api/inventory/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  getAllProducts,
  getLowStockProducts,
  getExpiredProducts,
  getProductById,
  addNewProduct,
  updateProduct,
  deleteProduct
};
