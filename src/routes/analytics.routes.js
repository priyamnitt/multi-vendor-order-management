const express = require('express');
const { 
  getVendorRevenue, 
  getTopProducts, 
  getAverageOrderValue, 
  getVendorDailySales, 
  getLowStockItems 
} = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { roles } = require('../config/config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin Analytics
router.get('/admin/vendor-revenue', authorize(roles.ADMIN), getVendorRevenue);
router.get('/admin/top-products', authorize(roles.ADMIN), getTopProducts);
router.get('/admin/average-order-value', authorize(roles.ADMIN), getAverageOrderValue);

// Vendor Analytics
router.get('/vendor/daily-sales', authorize(roles.VENDOR), getVendorDailySales);
router.get('/vendor/low-stock', authorize(roles.VENDOR), getLowStockItems);

module.exports = router; 