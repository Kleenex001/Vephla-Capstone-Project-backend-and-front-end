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
    type: mongoose.Schema.Types.ObjectId, // reference to Customer
    ref: 'Customer'
  },
  customerName: { 
    type: String // store customer name for fallback or legacy data
  },
  status: { 
    type: String, 
    enum: ['completed', 'pending'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
