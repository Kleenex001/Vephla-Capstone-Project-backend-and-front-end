const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Supplier name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Household Items", "Electronics", "Others"],
    default: "Others",
  },
  leadTime: {
    type: Number,
    required: [true, "Lead time is required"],
    min: [0, "Lead time cannot be negative"],
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
    default: 3,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "On Hold"],
    default: "Active",
  },
}, {
  timestamps: true,
});

// Optional: Add a virtual to display full info or formatted string
supplierSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.category})`;
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
