const Supplier = require("../models/Suppliers");

// --- Get all suppliers (only current user) ---
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.user.id });
    res.status(200).json({ status: "success", count: suppliers.length, data: suppliers });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch suppliers", error: err.message });
  }
};

// --- Add new supplier ---
exports.addSupplier = async (req, res) => {
  try {
    const { name, category, leadTime, purchase, email, phone, address } = req.body;

    if (!name || !category || leadTime == null || !email || !phone) {
      return res.status(400).json({ status: "fail", message: "Please provide all required fields." });
    }

    const supplier = new Supplier({
      name,
      category,
      leadTime,
      purchase,
      email,
      phone,
      address,
      userId: req.user.id, // 👈 tie to logged-in user
    });

    await supplier.save();
    res.status(201).json({ status: "success", data: supplier });
  } catch (err) {
    res.status(400).json({ status: "error", message: "Error adding supplier", error: err.message });
  }
};

// --- Update supplier (only if belongs to user) ---
exports.updateSupplier = async (req, res) => {
  try {
    const updates = req.body;
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // 👈 secure filter
      updates,
      { new: true, runValidators: true }
    );

    if (!supplier) return res.status(404).json({ status: "fail", message: "Supplier not found" });
    res.status(200).json({ status: "success", data: supplier });
  } catch (err) {
    res.status(400).json({ status: "error", message: "Error updating supplier", error: err.message });
  }
};

// --- Delete supplier (only if belongs to user) ---
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!supplier) return res.status(404).json({ status: "fail", message: "Supplier not found" });

    res.status(200).json({ status: "success", message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to delete supplier", error: err.message });
  }
};

// --- Confirm purchase (only if belongs to user) ---
exports.confirmPurchase = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { purchase: "Completed" },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ status: "fail", message: "Supplier not found" });

    res.status(200).json({ status: "success", data: supplier });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to confirm purchase", error: err.message });
  }
};

// --- Cancel purchase (only if belongs to user) ---
exports.cancelPurchase = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { purchase: "Cancelled" },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ status: "fail", message: "Supplier not found" });

    res.status(200).json({ status: "success", data: supplier });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to cancel purchase", error: err.message });
  }
};

// --- Get recent purchases (last 5, only this user) ---
exports.getRecentSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.status(200).json({ status: "success", count: suppliers.length, data: suppliers });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch recent suppliers", error: err.message });
  }
};

// --- Get top suppliers (completed purchases, only this user) ---
exports.getTopSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ purchase: "Completed", userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.status(200).json({ status: "success", count: suppliers.length, data: suppliers });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Failed to fetch top suppliers", error: err.message });
  }
};
