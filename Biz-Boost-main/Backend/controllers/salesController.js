// controllers/salesController.js
const Sale = require('../models/Sales');

// CREATE a new sale
exports.createSale = async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();

    res.status(201).json({
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to create sale',
      details: error.message
    });
  }
};

// READ all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find();

    res.status(200).json({
      message: 'Sales retrieved successfully',
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve sales',
      details: error.message
    });
  }
};

// UPDATE a sale by ID
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) {
      return res.status(404).json({
        error: 'Sale not found',
        id: req.params.id
      });
    }

    res.status(200).json({
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to update sale',
      details: error.message
    });
  }
};

// DELETE a sale by ID
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({
        error: 'Sale not found',
        id: req.params.id
      });
    }

    res.status(200).json({
      message: 'Sale deleted successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete sale',
      details: error.message
    });
  }
};
