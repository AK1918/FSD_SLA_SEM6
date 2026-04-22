const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
    unique: true
  },
  driver: {
    name: String,
    phone: String,
    email: String
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: { type: Date, default: Date.now }
  },
  path: [{
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['assigned', 'en-route', 'near-destination', 'completed'],
    default: 'assigned'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);
