const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true
  },
  requirement: {
    type: String,
    required: [true, 'Please add requirement details']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'dispatched', 'delivered'],
    default: 'pending'
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
