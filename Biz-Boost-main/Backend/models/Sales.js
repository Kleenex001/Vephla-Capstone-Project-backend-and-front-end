const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  productName: { 
  type: String, 
  required: true
 },
  amount: { 
  type: Number, 
  required: true
 },
  paymentType: { 
  type: String, 
  enum: ['cash', 'mobile'], 
  required: true 
},
  customer: { 
  type: String
 },
  status: { 
  type: String, 
  enum: ['completed', 'pending'], 
  default: 'Completed' },
  createdAt: { 
  type: Date, 
  default: Date.now
 }
});

module.exports = mongoose.model('Sale', SaleSchema);