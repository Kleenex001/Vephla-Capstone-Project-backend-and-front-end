const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
    try {
        const [salesRes, expensesRes] = await Promise.all([
            axios.get(`${BASE_URL}/api/sales/total`),
            axios.get(`${BASE_URL}/api/expenses/total`)
        ]);

        const totalSales = salesRes.data.total || 0;
        const expenses = expensesRes.data.total || 0;
        const profit = totalSales - expenses;

        res.json({
            totalSales,
            expenses,
            profit
        });
    } catch (error) {
        console.error("Error fetching summary:", error.message);
        res.status(500).json({ error: 'Failed to load summary data' });
    }
};

// GET /api/dashboard/sales-analytics
exports.getSalesAnalytics = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/sales/analytics`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching sales analytics:", error.message);
        res.status(500).json({ error: 'Failed to load sales analytics' });
    }
};

// GET /api/dashboard/overdue-payments
exports.getOverduePayments = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/payments/overdue`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching overdue payments:", error.message);
        res.status(500).json({ error: 'Failed to load overdue payments' });
    }
};

// GET /api/dashboard/quick-stats
exports.getQuickStats = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/products/quick-stats`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching quick stats:", error.message);
        res.status(500).json({ error: 'Failed to load quick stats' });
    }
};

// GET /api/dashboard/top-customers
exports.getTopCustomers = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/customers/top`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching top customers:", error.message);
        res.status(500).json({ error: 'Failed to load top customers' });
    }
};
