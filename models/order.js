const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: String,
  platform: String,
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  retryCount: { type: Number, default: 0 },
  lastRetryAt: Date,
  errorMessage: String,
  orderDetails: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    items: [{ 
      name: String,
      quantity: Number,
      price: Number
    }]
  }
});

module.exports = mongoose.model('Order', OrderSchema);
