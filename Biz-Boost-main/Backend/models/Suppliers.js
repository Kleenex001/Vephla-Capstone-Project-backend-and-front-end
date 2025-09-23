const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // tie supplier to logged-in user
    },
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
    purchase: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    email: {
      type: String,
      required: [true, "Supplier email is required"],
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Supplier phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property for formatted display name
supplierSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.category})`;
});

module.exports = mongoose.model("Supplier", supplierSchema);
