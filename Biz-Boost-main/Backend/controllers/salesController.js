// controllers/salesController.js
const Sale = require("../models/Sales");

// ----------------- EXTRA ENDPOINTS FOR DASHBOARD -----------------

// Summary stats (with optional date range, default last 30 days)
exports.getSalesSummary = async (req, res) => {
  try {
    let { start, end } = req.query;

    if (!start && !end) {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    let filter = {};
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const sales = await Sale.find(filter);

    const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
    const cashSales = sales
      .filter((s) => s.paymentType === "cash")
      .reduce((sum, s) => sum + s.amount, 0);
    const mobileSales = sales
      .filter((s) => s.paymentType === "mobile")
      .reduce((sum, s) => sum + s.amount, 0);
    const pendingOrders = sales.filter((s) => s.status === "pending").length;

    res.status(200).json({
      totalSales,
      cashSales,
      mobileSales,
      pendingOrders,
      range: { start, end },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch sales summary",
      details: error.message,
    });
  }
};

// Sales analytics (monthly or yearly, with default last 30 days)
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { view = "monthly" } = req.query;
    let { start, end } = req.query;

    if (!start && !end) {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    let filter = {};
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }

    const sales = await Sale.find(filter);

    let analytics;
    if (view === "monthly") {
      analytics = new Array(12).fill(0);
      sales.forEach((s) => {
        const month = new Date(s.date).getMonth();
        analytics[month] += s.amount;
      });
    } else {
      analytics = {};
      sales.forEach((s) => {
        const year = new Date(s.date).getFullYear();
        analytics[year] = (analytics[year] || 0) + s.amount;
      });
    }

    res.status(200).json({ view, analytics, range: { start, end } });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch sales analytics",
      details: error.message,
    });
  }
};

// Top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const sales = await Sale.find();
    const customers = {};

    sales.forEach((s) => {
      customers[s.customerName] = (customers[s.customerName] || 0) + s.amount;
    });

    const sorted = Object.entries(customers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ topCustomers: sorted });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch top customers",
      details: error.message,
    });
  }
};

// Top products
exports.getTopProducts = async (req, res) => {
  try {
    const sales = await Sale.find();
    const products = {};

    sales.forEach((s) => {
      products[s.productName] = (products[s.productName] || 0) + s.amount;
    });

    const sorted = Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ topProducts: sorted });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch top products",
      details: error.message,
    });
  }
};
// ----------------- CRUD OPERATIONS -----------------

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales", details: error.message });
  }
};

// Create a sale
exports.createSale = async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ error: "Failed to create sale", details: error.message });
  }
};

// Update a sale by ID
exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.status(200).json(sale);
  } catch (error) {
    res.status(400).json({ error: "Failed to update sale", details: error.message });
  }
};

// Delete a sale by ID
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete sale", details: error.message });
  }
};
