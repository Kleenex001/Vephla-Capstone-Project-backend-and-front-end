const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  packageWorth: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'overdue'],
    required: true,
    set: v => Customer.normalizeStatus(v),
  },
  userId: { // 👈 assign the owner
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

// Static helper method to normalize status
customerSchema.statics.normalizeStatus = function(status) {
  if (!status) return 'overdue';
  const lower = status.toLowerCase();
  if (lower === 'owed') return 'overdue';
  return lower;
};

// Instance method to mark customer as paid
customerSchema.methods.markPaid = function() {
  this.status = 'paid';
  return this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
