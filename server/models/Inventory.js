const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Bakery', 'Dairy', 'Produce', 'Meat', 'Pantry']
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: 0
  },
  unit: {
    type: String,
    required: [true, 'Please add a unit'],
    enum: ['kg', 'liters', 'units', 'packets']
  },
  expirationDate: {
    type: Date,
    required: [true, 'Please add an expiration date']
  },
  status: {
    type: String,
    enum: ['Fresh', 'Expiring Soon', 'Expired', 'Donated', 'Discounted'],
    default: 'Fresh'
  },
  price: {
    type: Number,
    default: 0
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);
