// models/Delivery.js

const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true
  },
  package: {
    type: String,
    required: [true, "Package details are required"],
    trim: true
  },
  date: {
    type: Date,
    required: [true, "Delivery date is required"]
  },
  agent: {
    type: String,
    required: [true, "Delivery agent is required"],
    trim: true
  },
  agentType: {
    type: String,
    enum: ["waybill", "logistic company", "other"],
    default: "other"
  },
  agentPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
    set: v => v.toLowerCase()
  }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
