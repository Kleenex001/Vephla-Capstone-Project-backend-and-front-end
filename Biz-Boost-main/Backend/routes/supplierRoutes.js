const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

// --- CRUD Operations ---
// Get all suppliers
router.get("/", supplierController.getSuppliers);

// Add a new supplier
router.post("/", supplierController.addSupplier);

// Update supplier by ID
router.put("/:id", supplierController.updateSupplier);

// Delete supplier by ID
router.delete("/:id", supplierController.deleteSupplier);

// --- Purchase Actions ---
// Confirm purchase
router.put("/confirm/:id", supplierController.confirmPurchase);

// Cancel purchase
router.put("/cancel/:id", supplierController.cancelPurchase);

// --- Additional Routes for Dashboard/Stats ---
// Get recent purchases (last N suppliers)
router.get("/recent", supplierController.getRecentSuppliers);

// Get top suppliers (by completed purchases)
router.get("/top", supplierController.getTopSuppliers);

module.exports = router;
