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
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer'
  },
  customerName: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['completed', 'pending'], 
    default: 'pending' 
  },
  userId: { // 👈 assign owner
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now
  }
});

module.exports = mongoose.model('Sale', SaleSchema);
