const { PrismaClient } = require('../../src/generated/prisma');

const prisma = new PrismaClient();

// Place a new order (customer only)
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const customerId = req.user.id;

    // Start a transaction for order creation and stock update
    const result = await prisma.$transaction(async (tx) => {
      // Fetch products with their details
      const productIds = items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds
          }
        }
      });

      // Validate products exist and have sufficient stock
      const productsMap = {};
      products.forEach(product => {
        productsMap[product.id] = product;
      });

      // Check if all products exist and have sufficient stock
      for (const item of items) {
        const product = productsMap[item.productId];
        
        if (!product) {
          throw new Error(`Product with id ${item.productId} not found`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
      }

      // Group items by vendor
      const vendorItems = {};
      let totalAmount = 0;

      for (const item of items) {
        const product = productsMap[item.productId];
        const vendorId = product.vendorId;
        
        if (!vendorItems[vendorId]) {
          vendorItems[vendorId] = [];
        }
        
        vendorItems[vendorId].push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
        
        totalAmount += product.price * item.quantity;
      }

      // Create main order
      const order = await tx.order.create({
        data: {
          customerId,
          totalAmount,
          status: 'pending'
        }
      });

      // Create vendor sub-orders and order items
      const vendorOrderPromises = [];
      
      for (const [vendorId, vendorItemsList] of Object.entries(vendorItems)) {
        const vendorTotalAmount = vendorItemsList.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);

        const vendorOrder = await tx.vendorOrder.create({
          data: {
            vendorId,
            orderId: order.id,
            totalAmount: vendorTotalAmount,
            status: 'pending'
          }
        });

        // Create order items for this vendor
        for (const item of vendorItemsList) {
          await tx.orderItem.create({
            data: {
              productId: item.productId,
              orderId: order.id,
              vendorOrderId: vendorOrder.id,
              quantity: item.quantity,
              price: item.price
            }
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return order;
    });

    // Fetch the complete order with items and vendor orders
    const completeOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        vendorOrders: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true
              }
            },
            orderItems: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(error.message.includes('not found') || error.message.includes('Insufficient stock') ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// Get customer orders (customer only)
const getCustomerOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        customerId: req.user.id
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        vendorOrders: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

// Get vendor orders (vendor only)
const getVendorOrders = async (req, res) => {
  try {
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        vendorId: req.user.id
      },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: vendorOrders.length,
      data: vendorOrders
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor orders'
    });
  }
};

// Get order by id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Determine the role-specific query
    let order;
    
    if (req.user.role === 'ADMIN') {
      // Admin can view any order
      order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          orderItems: {
            include: {
              product: true
            }
          },
          vendorOrders: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true
                }
              },
              orderItems: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });
    } else if (req.user.role === 'CUSTOMER') {
      // Customer can only view their own orders
      order = await prisma.order.findFirst({
        where: {
          id,
          customerId: req.user.id
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          vendorOrders: {
            include: {
              vendor: {
                select: {
                  id: true,
                  name: true
                }
              },
              orderItems: {
                include: {
                  product: true
                }
              }
            }
          }
        }
      });
    } else if (req.user.role === 'VENDOR') {
      // Vendor can only view vendor orders in which they are involved
      const vendorOrder = await prisma.vendorOrder.findFirst({
        where: {
          orderId: id,
          vendorId: req.user.id
        },
        include: {
          order: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (vendorOrder) {
        return res.status(200).json({
          success: true,
          data: vendorOrder
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order'
    });
  }
};

// Update vendor order status (vendor only)
const updateVendorOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Ensure vendor order exists and belongs to this vendor
    const vendorOrder = await prisma.vendorOrder.findFirst({
      where: {
        id,
        vendorId: req.user.id
      }
    });
    
    if (!vendorOrder) {
      return res.status(404).json({
        success: false,
        message: 'Vendor order not found'
      });
    }
    
    // Update vendor order status
    const updatedVendorOrder = await prisma.vendorOrder.update({
      where: { id },
      data: { status }
    });
    
    // Check if all vendor orders for the main order have the same status
    // If so, update the main order status too
    const allVendorOrders = await prisma.vendorOrder.findMany({
      where: {
        orderId: vendorOrder.orderId
      }
    });
    
    const allSameStatus = allVendorOrders.every(vo => vo.status === status);
    
    if (allSameStatus) {
      await prisma.order.update({
        where: { id: vendorOrder.orderId },
        data: { status }
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedVendorOrder
    });
  } catch (error) {
    console.error('Update vendor order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor order status'
    });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getVendorOrders,
  getOrderById,
  updateVendorOrderStatus
}; 