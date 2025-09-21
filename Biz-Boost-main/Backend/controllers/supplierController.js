const Supplier = require("../models/Suppliers");

// --- Get all suppliers ---
exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};

// --- Add new supplier ---
exports.addSupplier = async (req, res) => {
  try {
    const { name, category, leadTime, purchase, email, phone, address } = req.body;

    // Basic validation before hitting schema rules
    if (!name || !category || leadTime == null || !email || !phone) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }

    const supplier = new Supplier({
      name,
      category,
      leadTime,
      purchase,
      email,
      phone,
      address,
    });

    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// --- Update supplier ---
exports.updateSupplier = async (req, res) => {
  try {
    const { name, category, leadTime, purchase, email, phone, address } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, category, leadTime, purchase, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// --- Delete supplier ---
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete supplier" });
  }
};

// --- Confirm purchase ---
exports.confirmPurchase = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { purchase: "Completed" },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: "Failed to confirm purchase" });
  }
};

// --- Cancel purchase ---
exports.cancelPurchase = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { purchase: "Cancelled" },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel purchase" });
  }
};
// --- Get recent purchases (last 5 suppliers) ---
exports.getRecentSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 }) // newest first
      .limit(5);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent suppliers" });
  }
};

// --- Get top suppliers (by completed purchases count) ---
exports.getTopSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ purchase: "Completed" })
      .sort({ createdAt: -1 }) // you can adjust sorting logic
      .limit(5);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top suppliers" });
  }
};
