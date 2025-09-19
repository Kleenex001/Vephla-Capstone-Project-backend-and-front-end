const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  packageWorth: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['PAID', 'OVERDUE'],        // store only lowercase
    required: true,
    set: v => {
      if (!v) return v;
      v = v.toLowerCase();
      if (v === 'owed') return 'overdue';  // convert "owed" to "overdue"
      return v;       // normalize input to lowercase
    },
  },
}, { timestamps: true }); 

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
