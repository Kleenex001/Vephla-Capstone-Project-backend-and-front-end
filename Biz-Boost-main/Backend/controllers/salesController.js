// controllers/salesController.js
const Sale = require("../models/Sales");
const Inventory = require("../models/Inventory");

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
      data: { totalSales, cashSales, mobileSales, completedOrders, pendingOrders },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch KPIs", error: error.message });
  }
};

// Sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { view = "monthly" } = req.query;
    const sales = await Sale.find({ userId: req.user.id });

    if (!sales.length) {
      return res.status(200).json({
        status: "success",
        view,
        analytics: view === "monthly" ? Array(12).fill(0) : {},
        message: "No sales found for this user",
      });
    }

    let analytics;
    if (view === "monthly") {
      analytics = Array(12).fill(0);
      sales.forEach(s => {
        const rawDate = s.date || s.createdAt;
        if (!rawDate) return;
        const date = new Date(rawDate);
        if (isNaN(date)) return;
        const month = date.getMonth();
        analytics[month] += Number(s.amount || 0);
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
      });
    }

    res.status(200).json({ status: "success", view, analytics });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch analytics", error: error.message });
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

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.id });
    res.status(200).json({ status: "success", count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch sales", error: error.message });
  }
};

// Create a sale with inventory sync
exports.createSale = async (req, res) => {
  try {
    const { productId, quantity, paymentType, customerName, status, date } = req.body;

    if (!productId) return res.status(400).json({ status: "fail", message: "Product ID is required" });

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ status: "fail", message: "Quantity must be a positive number" });

    // fetch product
    const product = await Inventory.findOne({ _id: productId, userId: req.user.id });
    if (!product) return res.status(404).json({ status: "fail", message: "Product not found" });

    // check expiry
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      return res.status(400).json({ status: "fail", message: "Product is expired, cannot sell" });
    }

    // check stock
    if (product.stockLevel < qty) {
      return res.status(400).json({ status: "fail", message: "Not enough stock available" });
    }

    // ensure price is valid
    const price = Number(product.price);
    if (isNaN(price) || price < 0) return res.status(400).json({ status: "fail", message: "Invalid product price" });

    // reduce stock
    product.stockLevel -= qty;
    await product.save();

    // create sale
    const amount = price * qty;

    const sale = await Sale.create({
      productId,
      productName: product.productName,
      quantity: qty,
      amount, // always numeric
      paymentType: paymentType?.toLowerCase() || "",
      customerName: customerName || "",
      status: status?.toLowerCase() || "pending",
      date: date || new Date(),
      userId: req.user.id,
    });

    res.status(201).json({ status: "success", data: sale });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ status: "error", message: "Failed to create sale", error: error.message });
  }
};

// Update a sale with inventory sync and automatic amount calculation
exports.updateSale = async (req, res) => {
  try {
    const { quantity, productId, paymentType, customerName, status } = req.body;

    const existingSale = await Sale.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existingSale) return res.status(404).json({ status: "fail", message: "Sale not found" });

    // Determine product to use
    const productToUseId = productId || existingSale.productId;
    const product = await Inventory.findOne({ _id: productToUseId, userId: req.user.id });
    if (!product) return res.status(404).json({ status: "fail", message: "Product not found in inventory" });

    // Validate quantity
    const qty = parseInt(quantity || existingSale.quantity, 10);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ status: "fail", message: "Quantity must be a positive number" });

    // Restore old stock if changing product or quantity
    if (quantity || productId) {
      const oldProduct = await Inventory.findOne({ _id: existingSale.productId, userId: req.user.id });
      if (oldProduct) {
        oldProduct.stockLevel += existingSale.quantity;
        await oldProduct.save();
      }

      // Check new stock availability
      if (product.stockLevel < qty) {
        return res.status(400).json({ status: "fail", message: "Not enough stock for update" });
      }

      // Deduct new quantity
      product.stockLevel -= qty;
      await product.save();
    }

    // Ensure price is valid
    const price = Number(product.price);
    if (isNaN(price) || price < 0) return res.status(400).json({ status: "fail", message: "Invalid product price" });

    // Recalculate amount
    const updatedAmount = price * qty;

    // Prepare updates
    const updates = {
      productId: product._id,
      productName: product.productName,
      quantity: qty,
      amount: updatedAmount, // ✅ always numeric
      paymentType: paymentType?.toLowerCase() || existingSale.paymentType,
      customerName: customerName || existingSale.customerName,
      status: status?.toLowerCase() || existingSale.status
    };

    const updatedSale = await Sale.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: "success", data: updatedSale });
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ status: "error", message: "Failed to update sale", error: error.message });
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

// Delete a sale + restore stock
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!sale) return res.status(404).json({ status: "fail", message: "Sale not found" });

    const product = await Inventory.findOne({ _id: sale.productId, userId: req.user.id });
    if (product) {
      product.quantity += sale.quantity;
      await product.save();
    }

    res.status(200).json({ status: "success", message: "Sale deleted successfully" });
  } catch (error) {
    res.status(400).json({ status: "error", message: "Failed to delete sale", error: error.message });
  }
};
