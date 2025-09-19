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
    enum: ['paid', 'overdue'], // store only lowercase
    required: true,
    set: v => Customer.normalizeStatus(v),
  },
}, {
  timestamps: true,
});

// Static helper method to normalize status
customerSchema.statics.normalizeStatus = function(status) {
  if (!status) return 'overdue'; // default
  const lower = status.toLowerCase();
  if (lower === 'owed') return 'overdue';
  return lower; // ensure lowercase
};

// Optional: Instance method to mark customer as paid
customerSchema.methods.markPaid = function() {
  this.status = 'paid';
  return this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;