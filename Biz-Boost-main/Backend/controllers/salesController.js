const Sale = require("../models/Sales");

// ----------------- DASHBOARD ENDPOINTS -----------------
// KPI summary
exports.getSalesSummary = async (req, res) => {
  try {
    const sales = await Sale.find();

    const totalSales = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const cashSales = sales
      .filter(s => s.paymentType === "cash")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const mobileSales = sales
      .filter(s => s.paymentType === "mobile")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const completedOrders = sales.filter(s => s.status === "completed").length;
    const pendingOrders = sales.filter(s => s.status === "pending").length;

    // Send flat object
    res.status(200).json({ totalSales, cashSales, mobileSales, completedOrders, pendingOrders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch KPIs", details: error.message });
  }
};


// Sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { view = "monthly" } = req.query;
    const sales = await Sale.find();

    let analytics;
    if (view === "monthly") {
      analytics = Array(12).fill(0);
      sales.forEach(s => {
        const month = new Date(s.date).getMonth();
        analytics[month] += s.amount;
      });
    } else {
      analytics = {};
      sales.forEach(s => {
        const year = new Date(s.date).getFullYear();
        analytics[year] = (analytics[year] || 0) + s.amount;
      });
    }

    res.status(200).json({ view, analytics });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch analytics", details: error.message });
  }
};

// Top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const sales = await Sale.find();
    const customers = {};

    sales.forEach(s => {
      const name = s.customerName || "Unknown";
      customers[name] = (customers[name] || 0) + s.amount;
    });

    const topCustomers = Object.entries(customers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ topCustomers });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top customers", details: error.message });
  }
};

// Top products
exports.getTopProducts = async (req, res) => {
  try {
    const sales = await Sale.find();
    const products = {};

    sales.forEach(s => {
      const name = s.productName;
      products[name] = (products[name] || 0) + s.amount;
    });

    const topProducts = Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ topProducts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top products", details: error.message });
  }
};

// Pending orders (optional helper endpoint)
exports.getPendingOrders = async (req, res) => {
  try {
    const pending = await Sale.find({ status: "pending" });
    res.status(200).json({ pending });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending orders", details: error.message });
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
    const { productName, amount, paymentType, customerName, status, date } = req.body;

    const sale = new Sale({
      productName,
      amount,
      paymentType: paymentType?.toLowerCase(),
      customerName,
      status: status?.toLowerCase(),
      date: date || new Date(),
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ error: "Failed to create sale", details: error.message });
  }
};

// Update a sale
exports.updateSale = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.paymentType) updates.paymentType = updates.paymentType.toLowerCase();
    if (updates.status) updates.status = updates.status.toLowerCase();

    const sale = await Sale.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    res.status(200).json(sale);
  } catch (error) {
    res.status(400).json({ error: "Failed to update sale", details: error.message });
  }
};

// Mark sale as completed (optional endpoint)
exports.completeSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, { status: "completed" }, { new: true });
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    res.status(200).json(sale);
  } catch (error) {
    res.status(400).json({ error: "Failed to complete sale", details: error.message });
  }
};

// Delete a sale
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete sale", details: error.message });
  }
};
