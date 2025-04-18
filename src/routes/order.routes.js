const express = require('express');
const { 
  createOrder, 
  getCustomerOrders, 
  getVendorOrders, 
  getOrderById, 
  updateVendorOrderStatus 
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/order.validators');
const { roles } = require('../config/config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create order (customer only)
router.post('/', authorize(roles.CUSTOMER), validate(createOrderSchema), createOrder);

// Get customer orders (customer only)
router.get('/customer/my-orders', authorize(roles.CUSTOMER), getCustomerOrders);

// Get vendor orders (vendor only)
router.get('/vendor/my-orders', authorize(roles.VENDOR), getVendorOrders);

// Get order by id (admin, customer, vendor)
router.get('/:id', getOrderById);

// Update vendor order status (vendor only)
router.patch('/vendor/:id/status', 
  authorize(roles.VENDOR), 
  validate(updateOrderStatusSchema), 
  updateVendorOrderStatus
);

module.exports = router; 