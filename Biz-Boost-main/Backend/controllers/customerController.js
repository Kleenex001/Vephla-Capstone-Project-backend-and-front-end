const Customer = require('../models/Customer');

// Get all customers for the logged-in user
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user.id });
    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get a single customer by ID (must belong to the logged-in user)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Add a new customer (assign to logged-in user)
exports.addNewCustomer = async (req, res) => {
  try {
    const newCustomer = await Customer.create({
      ...req.body,
      userId: req.user.id, // 👈 attach owner
    });
    res.status(201).json({ success: true, data: newCustomer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update a customer (only if it belongs to logged-in user)
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, // 👈 secure filter
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a customer (only if it belongs to logged-in user)
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // 👈 secure filter
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get customers with overdue payments (only for logged-in user)
exports.getOverduePayments = async (req, res) => {
  try {
    const overdueCustomers = await Customer.find({ status: 'overdue', userId: req.user.id });
    res.status(200).json({ success: true, data: overdueCustomers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
