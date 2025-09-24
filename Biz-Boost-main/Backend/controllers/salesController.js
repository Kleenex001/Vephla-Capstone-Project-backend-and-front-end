// controllers/salesController.js
const Sale = require("../models/Sales");

// ----------------- DASHBOARD ENDPOINTS -----------------

// KPI summary
exports.getSalesSummary = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id });

    const totalSales = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const cashSales = sales
      .filter(s => s.paymentType === "cash")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const mobileSales = sales
      .filter(s => s.paymentType === "mobile")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const completedOrders = sales.filter(s => s.status === "completed").length;
    const pendingOrders = sales.filter(s => s.status === "pending").length;

    res.status(200).json({
      status: "success",
      data: { totalSales, cashSales, mobileSales, completedOrders, pendingOrders }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch KPIs", error: error.message });
  }
};

// Sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { view = "monthly" } = req.query;

    // Fetch all sales for this user
    const sales = await Sale.find({ userId: req.user.id });
    console.log("Total sales fetched:", sales.length);

    if (!sales.length) {
      return res.status(200).json({
        status: "success",
        view,
        analytics: view === "monthly" ? Array(12).fill(0) : {},
        message: "No sales found for this user"
      });
    }

    let analytics;

    if (view === "monthly") {
      analytics = Array(12).fill(0);

      sales.forEach(s => {
        // Use 'date' if present, else fallback to 'createdAt'
        const rawDate = s.date || s.createdAt;
        if (!rawDate) return;

        const date = new Date(rawDate);
        if (isNaN(date)) return;

        const month = date.getMonth(); // 0 = Jan, 11 = Dec
        analytics[month] += Number(s.amount || 0);

        console.log(`Adding ${s.amount} to month ${month} for sale on ${date}`);
      });

    } else {
      analytics = {};
      sales.forEach(s => {
        const rawDate = s.date || s.createdAt;
        if (!rawDate) return;

        const date = new Date(rawDate);
        if (isNaN(date)) return;

        const year = date.getFullYear();
        analytics[year] = (analytics[year] || 0) + Number(s.amount || 0);

        console.log(`Adding ${s.amount} to year ${year} for sale on ${date}`);
      });
    }

    res.status(200).json({ status: "success", view, analytics });

  } catch (error) {
    console.error("Error in getSalesAnalytics:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
};

// Top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id });
    const customers = {};

    sales.forEach(s => {
      const name = s.customerName || "Unknown";
      customers[name] = (customers[name] || 0) + Number(s.amount || 0);
    });

    const topCustomers = Object.entries(customers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ status: "success", data: topCustomers });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch top customers", error: error.message });
  }
};

// Top products
exports.getTopProducts = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id });
    const products = {};

    sales.forEach(s => {
      const name = s.productName || "Unnamed";
      products[name] = (products[name] || 0) + Number(s.amount || 0);
    });

    const topProducts = Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.status(200).json({ status: "success", data: topProducts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch top products", error: error.message });
  }
};

// Pending orders
exports.getPendingOrders = async (req, res) => {
  try {
    const pending = await Sale.find({ status: "pending", userId: req.user.id });
    res.status(200).json({ status: "success", count: pending.length, data: pending });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch pending orders", error: error.message });
  }
};

// ----------------- CRUD OPERATIONS -----------------

// Get all sales (only for this user)
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id });
    res.status(200).json({ status: "success", count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch sales", error: error.message });
  }
};

// Create a sale
exports.createSale = async (req, res) => {
  try {
    const { productName, amount, paymentType, customerName, status, date } = req.body;

    const sale = new Sale({
      productName,
      amount: Number(amount),
      paymentType: paymentType?.toLowerCase(),
      customerName,
      status: status?.toLowerCase() || "pending",
      date: date || new Date(),
      userId: req.user.id,
    });

    const savedSale = await sale.save();
    res.status(201).json({ status: "success", data: savedSale });
  } catch (error) {
    res.status(400).json({ status: "error", message: "Failed to create sale", error: error.message });
  }
};

// Update a sale
exports.updateSale = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.paymentType) updates.paymentType = updates.paymentType.toLowerCase();
    if (updates.status) updates.status = updates.status.toLowerCase();
    if (updates.amount) updates.amount = Number(updates.amount);

    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!sale) return res.status(404).json({ status: "fail", message: "Sale not found" });

    res.status(200).json({ status: "success", data: sale });
  } catch (error) {
    res.status(400).json({ status: "error", message: "Failed to update sale", error: error.message });
  }
};

// Mark sale as completed
exports.completeSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "completed" },
      { new: true }
    );

    if (!sale) return res.status(404).json({ status: "fail", message: "Sale not found" });

    res.status(200).json({ status: "success", data: sale });
  } catch (error) {
    res.status(400).json({ status: "error", message: "Failed to complete sale", error: error.message });
  }
};

// Delete a sale
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!sale) return res.status(404).json({ status: "fail", message: "Sale not found" });

    res.status(200).json({ status: "success", message: "Sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: "Failed to delete sale", error: error.message });
  }
};
