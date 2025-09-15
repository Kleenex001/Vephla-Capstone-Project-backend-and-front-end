const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
  },
  stockLevel: {
    type: Number,
    required: [true, 'Please add a stock level'],
    min: 0,
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Please add a reorder level'],
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add an expiry date'],
  },
  category: {
    type: String,
    required: [true, 'Please add a product category'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Please add a unit price'],
    min: 0,
  },
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
