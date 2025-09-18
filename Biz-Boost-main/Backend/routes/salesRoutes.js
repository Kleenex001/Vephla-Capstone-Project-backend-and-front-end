const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

// ---------------- DASHBOARD ENDPOINTS ----------------
// Place these BEFORE /:id to avoid conflicts
router.get("/summary/kpis", salesController.getSalesSummary);
router.get("/analytics", salesController.getSalesAnalytics);
router.get("/top-customers", salesController.getTopCustomers);
router.get("/top-products", salesController.getTopProducts);
router.get("/pending-orders", salesController.getPendingOrders); // optional helper

// ---------------- CRUD ----------------
router
  .route("/")
  .get(salesController.getAllSales)
  .post(salesController.createSale);

router
  .route("/:id")
  .put(salesController.updateSale) // update sale
  .delete(salesController.deleteSale); // delete sale

// ---------------- SALE ACTIONS ----------------
router.patch("/:id/complete", salesController.completeSale); // mark sale as completed

module.exports = router;
