const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Dashboard summary
router.get('/summary', dashboardController.getSummary);

// Sales analytics
router.get('/sales-analytics', dashboardController.getSalesAnalytics);

// Overdue payments
router.get('/overdue-payments', dashboardController.getOverduePayments);

// Quick stats
router.get('/quick-stats', dashboardController.getQuickStats);

// Top customers
router.get('/top-customers', dashboardController.getTopCustomers);

module.exports = router;
