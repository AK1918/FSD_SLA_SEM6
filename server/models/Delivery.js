const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  trackingId: {
    type: String,
    required: true
  },
  carrier: {
    type: String,
    default: 'Local Delivery'
  },
  status: {
    type: String,
    enum: ['in-transit', 'delivered'],
    default: 'in-transit'
  },
  receivedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
