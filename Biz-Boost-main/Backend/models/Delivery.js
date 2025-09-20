// models/Delivery.js

const mongoose = require('mongoose');

// Agent sub-schema
const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Agent name is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["waybill", "logistic company", "other"],
    default: "other",
    required: [true, "Agent type is required"],
  },
  phone: {
    type: String,
    required: [true, "Agent phone number is required"],
    trim: true,
  },
  deliveriesCompleted: {
    type: Number,
    default: 0,
  },
}, { _id: false }); // prevent creating a separate _id for agent sub-doc

// Delivery schema
const deliverySchema = new mongoose.Schema({
  customer: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
  },
  package: {
    type: String,
    required: [true, "Package details are required"],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, "Delivery date is required"],
  },
  agent: {
    type: agentSchema, // Embed agent directly inside delivery
    required: [true, "Delivery agent is required"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
    set: v => v.toLowerCase(),
  },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
