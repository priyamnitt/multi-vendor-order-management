const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

// Create a new product (vendor only)
const createProduct = async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;
    
    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        category,
        vendorId: req.user.id
      }
    });
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    
    let whereClause = {};
    
    // Apply filters if provided
    if (category) {
      whereClause.category = category;
    }
    
    if (minPrice || maxPrice) {
      whereClause.price = {};
      
      if (minPrice) {
        whereClause.price.gte = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        whereClause.price.lte = parseFloat(maxPrice);
      }
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
};

// Get vendor products
const getVendorProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        vendorId: req.user.id
      }
    });
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor products'
    });
  }
};

// Get product by id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product'
    });
  }
};

// Update product (vendor only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    
    // Check if product exists and belongs to the vendor
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (existingProduct.vendorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this product'
      });
    }
    
    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        price,
        stock,
        category
      }
    });
    
    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};

// Delete product (vendor only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists and belongs to the vendor
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (existingProduct.vendorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this product'
      });
    }
    
    // Delete product
    await prisma.product.delete({
      where: { id }
    });
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getVendorProducts,
  getProductById,
  updateProduct,
  deleteProduct
}; 