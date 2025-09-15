const Supplier = require('../models/Suppliers');

// @desc    Get all suppliers with optional status filter
// @route   GET /api/suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const suppliers = await Supplier.find(query);
    res.status(200).json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get a single supplier by ID
// @route   GET /api/suppliers/:id
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Add a new supplier
// @route   POST /api/suppliers
exports.addNewSupplier = async (req, res) => {
  try {
    const newSupplier = await Supplier.create(req.body);
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Update a supplier by ID
// @route   PUT /api/suppliers/:id
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Delete a supplier by ID
// @route   DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get a list of top-rated suppliers
// @route   GET /api/suppliers/top-rated
exports.getTopRatedSuppliers = async (req, res) => {
  try {
    const topRatedSuppliers = await Supplier.find().sort({ rating: -1 }).limit(5);
    res.status(200).json(topRatedSuppliers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
