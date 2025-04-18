const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

// Admin: Revenue per vendor (last 30 days)
const getVendorRevenue = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const vendorRevenue = await prisma.vendorOrder.groupBy({
      by: ['vendorId'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: {
          not: 'cancelled'
        }
      },
      _sum: {
        totalAmount: true
      }
    });
    
    // Get vendor details
    const vendorIds = vendorRevenue.map(item => item.vendorId);
    const vendors = await prisma.user.findMany({
      where: {
        id: {
          in: vendorIds
        },
        role: 'VENDOR'
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    // Combine data
    const result = vendorRevenue.map(item => {
      const vendor = vendors.find(v => v.id === item.vendorId);
      return {
        vendor,
        revenue: item._sum.totalAmount || 0
      };
    });
    
    // Sort by revenue in descending order
    result.sort((a, b) => b.revenue - a.revenue);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get vendor revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor revenue'
    });
  }
};

// Admin: Top 5 products by sales
const getTopProducts = async (req, res) => {
  try {
    // Get order items for completed or processing orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: {
            in: ['completed', 'processing']
          }
        }
      },
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Calculate sales per product
    const productSales = {};
    
    orderItems.forEach(item => {
      const productId = item.productId;
      
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      
      productSales[productId].totalQuantity += item.quantity;
      productSales[productId].totalRevenue += item.price * item.quantity;
    });
    
    // Convert to array and sort by quantity
    const result = Object.values(productSales).sort((a, b) => 
      b.totalQuantity - a.totalQuantity
    ).slice(0, 5);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top products'
    });
  }
};

// Admin: Average order value
const getAverageOrderValue = async (req, res) => {
  try {
    const result = await prisma.order.aggregate({
      _avg: {
        totalAmount: true
      },
      where: {
        status: {
          not: 'cancelled'
        }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        averageOrderValue: result._avg.totalAmount || 0
      }
    });
  } catch (error) {
    console.error('Get average order value error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get average order value'
    });
  }
};

// Vendor: Daily sales (last 7 days)
const getVendorDailySales = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get vendor orders from last 7 days
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        vendorId,
        createdAt: {
          gte: sevenDaysAgo
        },
        status: {
          not: 'cancelled'
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Prepare data structure for daily sales
    const dailySales = {};
    
    // Initialize all days with zero sales
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailySales[dateString] = {
        date: dateString,
        totalSales: 0,
        orderCount: 0
      };
    }
    
    // Fill in actual sales data
    vendorOrders.forEach(order => {
      const dateString = order.createdAt.toISOString().split('T')[0];
      
      if (dailySales[dateString]) {
        dailySales[dateString].totalSales += order.totalAmount;
        dailySales[dateString].orderCount += 1;
      }
    });
    
    // Convert to array and sort by date
    const result = Object.values(dailySales).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get vendor daily sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily sales'
    });
  }
};

// Vendor: Low stock items
const getLowStockItems = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const lowStockThreshold = 10; // Items with stock < 10 are considered low stock
    
    const lowStockItems = await prisma.product.findMany({
      where: {
        vendorId,
        stock: {
          lt: lowStockThreshold
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });
    
    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock items'
    });
  }
};

module.exports = {
  getVendorRevenue,
  getTopProducts,
  getAverageOrderValue,
  getVendorDailySales,
  getLowStockItems
}; 