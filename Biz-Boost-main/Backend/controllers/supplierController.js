const Supplier = require('../models/Suppliers');

// Normalize status input
function normalizeStatus(status) {
  const validStatuses = ['Active', 'Inactive', 'On Hold'];
  if (!status) return undefined;
  const formatted = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return validStatuses.includes(formatted) ? formatted : undefined;
}

// @desc    Get all suppliers with optional status filter
// @route   GET /api/suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const status = normalizeStatus(req.query.status);
    const query = status ? { status } : {};
    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get a single supplier by ID
// @route   GET /api/suppliers/:id
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier)
      return res.status(404).json({ success: false, message: 'Supplier not found' });

    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a new supplier
// @route   POST /api/suppliers
exports.addNewSupplier = async (req, res) => {
  try {
    const { name, category, leadTime, rating, status } = req.body;

    // Validate required fields
    if (!name || !category || !leadTime || !rating)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const newSupplier = await Supplier.create({
      name,
      category,
      leadTime,
      rating,
      status: normalizeStatus(status) || 'Active',
    });

    res.status(201).json({
      success: true,
      data: newSupplier,
      message: 'Supplier created successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid data or server error' });
  }
};

// @desc    Update a supplier by ID
// @route   PUT /api/suppliers/:id
exports.updateSupplier = async (req, res) => {
  try {
    const updatedFields = { ...req.body };

    if (updatedFields.status) updatedFields.status = normalizeStatus(updatedFields.status);

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
      runValidators: true,
    });

    if (!supplier)
      return res.status(404).json({ success: false, message: 'Supplier not found' });

    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: 'Invalid data or server error' });
  }
};

// @desc    Delete a supplier by ID
// @route   DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier)
      return res.status(404).json({ success: false, message: 'Supplier not found' });

    res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get top-rated suppliers
// @route   GET /api/suppliers/top-rated
exports.getTopRatedSuppliers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const topSuppliers = await Supplier.find().sort({ rating: -1 }).limit(limit);
    res.status(200).json({ success: true, data: topSuppliers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
