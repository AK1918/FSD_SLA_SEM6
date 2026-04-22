const TrackingSession = require('../models/TrackingSession');
const Request = require('../models/Request');
const sendSMS = require('../utils/smsService');

// @desc    Create a tracking session
// @route   POST /api/tracking
// @access  Private (Vendor)
const createSession = async (req, res) => {
  try {
    const { requestId, driverName, driverPhone, driverEmail } = req.body;

    // Create session in isolated collection
    const session = await TrackingSession.create({
      requestId,
      driver: {
        name: driverName,
        phone: driverPhone,
        email: driverEmail
      }
    });

    // --- ENHANCED: Twilio SMS Notification with Order & Location Details ---
    const request = await Request.findById(requestId)
      .populate('inventoryItem', 'name quantity unit')
      .populate('ngo', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request details not found for SMS' });
    }

    const trackingLink = `http://localhost:5173/track/${session._id}`;
    const smsBody = `EcoBite: Hello ${driverName}! You have a new delivery.
Order: ${request.inventoryItem.name} (${request.quantity} ${request.inventoryItem.unit})
Deliver to: ${request.ngo.name}
Tracking Link: ${trackingLink}`;
    
    await sendSMS(driverPhone, smsBody);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update driver location
// @route   PUT /api/tracking/:id/location
// @access  Public (Driver Link)
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const session = await TrackingSession.findById(req.params.id);

    if (!session || !session.isActive) {
      return res.status(403).json({ message: 'Tracking session is inactive' });
    }

    session.currentLocation = { lat, lng, updatedAt: new Date() };
    session.path.push({ lat, lng });
    
    // Auto-update status based on proximity logic could go here
    
    await session.save();

    // Emit via Socket.io for live movement
    const io = req.app.get('io');
    io.to(session.requestId.toString()).emit('location-receive', {
      lat,
      lng,
      status: session.status,
      requestId: session.requestId
    });

    res.status(200).json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Terminate session (NGO Kill-Switch)
// @route   POST /api/tracking/:requestId/terminate
// @access  Private (NGO)
const terminateSession = async (req, res) => {
  try {
    const session = await TrackingSession.findOne({ requestId: req.params.requestId });

    if (session) {
      session.isActive = false;
      session.status = 'completed';
      // Anonymize path data for privacy
      session.path = []; 
      await session.save();

      // Notify driver to stop background services
      const io = req.app.get('io');
      io.to(session.requestId.toString()).emit('session-terminated');
    }

    res.status(200).json({ message: 'Tracking session terminated and data anonymized' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session data
// @route   GET /api/tracking/:requestId
// @access  Private
const getSession = async (req, res) => {
  try {
    const session = await TrackingSession.findOne({ requestId: req.params.requestId });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  updateLocation,
  terminateSession,
  getSession
};
