const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// Simulate common e-commerce errors
const possibleErrors = [
  'Payment verification failed',
  'Invalid shipping address',
  'Out of stock',
  'Platform API timeout',
  'Order validation failed'
];

// Helper to generate random order details
const generateOrderDetails = () => {
  const items = [
    { name: 'T-Shirt', price: 19.99 },
    { name: 'Jeans', price: 49.99 },
    { name: 'Sneakers', price: 79.99 },
    { name: 'Hat', price: 14.99 }
  ];
  
  const orderItems = Array(Math.floor(Math.random() * 3) + 1).fill(null).map(() => {
    const item = items[Math.floor(Math.random() * items.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    return {
      ...item,
      quantity
    };
  });

  const amount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    amount: Number(amount.toFixed(2)),
    currency: 'USD',
    items: orderItems
  };
};

router.post('/sync', async (req, res) => {
  try {
    const { platform, orders } = req.body;
    
    if (!platform || !orders || !Array.isArray(orders)) {
      return res.status(400).json({ 
        error: 'Invalid request. Platform and orders array are required.' 
      });
    }

    const newOrders = orders.map(order => {
      if (!order.orderId) {
        throw new Error('Order ID is required for each order');
      }

      const willFail = Math.random() > 0.7;
      return {
        orderId: order.orderId,
        platform,
        status: willFail ? 'failed' : 'success',
        errorMessage: willFail ? possibleErrors[Math.floor(Math.random() * possibleErrors.length)] : null,
        orderDetails: generateOrderDetails(),
        timestamp: new Date(),
        retryCount: 0
      };
    });

    const created = await Order.insertMany(newOrders);
    console.log(`Successfully created ${created.length} orders for ${platform}`);
    res.status(200).json(created);
  } catch (err) {
    console.error('Error syncing orders:', err);
    res.status(500).json({ 
      error: 'Failed to sync orders',
      details: err.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ timestamp: -1 });
    
    // Calculate platform statistics
    const stats = orders.reduce((acc, order) => {
      if (!acc[order.platform]) {
        acc[order.platform] = { total: 0, failed: 0, success: 0, pending: 0 };
      }
      acc[order.platform].total++;
      acc[order.platform][order.status]++;
      return acc;
    }, {});

    res.json({ orders, stats });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: err.message 
    });
  }
});

router.post('/retry/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // More realistic retry logic with increasing success rate
    const successRate = Math.min(0.7 + (order.retryCount * 0.1), 0.9);
    const success = Math.random() < successRate;

    const update = {
      status: success ? 'success' : 'failed',
      retryCount: (order.retryCount || 0) + 1,
      lastRetryAt: new Date(),
      errorMessage: success ? null : possibleErrors[Math.floor(Math.random() * possibleErrors.length)]
    };

    const updated = await Order.findByIdAndUpdate(
      req.params.id, 
      update, 
      { new: true }
    );
    
    console.log(`Order ${order.orderId} retry attempt ${update.retryCount}: ${success ? 'success' : 'failed'}`);
    res.json(updated);
  } catch (err) {
    console.error('Error retrying order:', err);
    res.status(500).json({ 
      error: 'Failed to retry order',
      details: err.message 
    });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$platform',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          avgRetryCount: { $avg: '$retryCount' }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: err.message 
    });
  }
});

module.exports = router;
