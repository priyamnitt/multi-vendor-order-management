const express = require('express');
const { 
  createProduct, 
  getAllProducts, 
  getVendorProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { createProductSchema, updateProductSchema } = require('../validators/product.validators');
const { roles } = require('../config/config');

const router = express.Router();

// Get all products (public)
router.get('/', getAllProducts);

// Protect the following routes - authentication required
router.use(authenticate);

// Get vendor products (vendor only)
router.get('/vendor/my-products', authorize(roles.VENDOR), getVendorProducts);

// Get product by id (public but moved below to prevent conflicts with above route)
router.get('/:id', getProductById);

// Create product (vendor only)
router.post('/', authorize(roles.VENDOR), validate(createProductSchema), createProduct);

// Update product (vendor only)
router.put('/:id', authorize(roles.VENDOR), validate(updateProductSchema), updateProduct);

// Delete product (vendor only)
router.delete('/:id', authorize(roles.VENDOR), deleteProduct);

module.exports = router; 