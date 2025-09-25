const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  productName: { 
    type: String, 
    required: true 
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  paymentType: { 
    type: String, 
    enum: ['cash', 'mobile'], 
    required: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer'
  },
  customerName: { 
    type: String,
    default: "Anonymous"
  },
  status: { 
    type: String, 
    enum: ['completed', 'pending'], 
    default: 'pending' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now
  }
});

// Optional: pre-save hook to ensure amount is always a number
SaleSchema.pre('save', function(next) {
  if (this.amount === undefined || isNaN(this.amount)) {
    this.amount = 0;
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);
