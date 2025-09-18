// controllers/salesController.js
const Sale = require("../models/Sales");

// ----------------- EXTRA ENDPOINTS FOR DASHBOARD -----------------

// Summary stats (with optional date range, default last 30 days)
exports.getSalesSummary = async (req, res) => {
  try {
    let { start, end } = req.query;

    // Default to last 30 days if no range provided
    if (!start && !end) {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    // Build filter
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

    // Default to last 30 days if no range provided
    if (!start && !end) {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    // Build filter
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
