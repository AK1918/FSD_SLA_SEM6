const Request = require('../models/Request');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const TrackingSession = require('../models/TrackingSession');
const createAuditLog = require('../utils/auditLogger');

// @desc    Create new request (NGO)
// @route   POST /api/requests
// @access  Private (NGO)
const createRequest = async (req, res) => {
  try {
    const { vendorId, itemId, requirement, quantity } = req.body;
    
    // 1. Validation: Check if vendor has enough stock
    const inventoryItem = await Inventory.findById(itemId);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (inventoryItem.quantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${inventoryItem.quantity} ${inventoryItem.unit} available.` 
      });
    }

    // 2. Update: Subtract quantity from inventory
    const oldQuantity = inventoryItem.quantity;
    inventoryItem.quantity -= quantity;
    
    // 3. Notification Logic: Alert if stock falls below threshold
    if (inventoryItem.quantity < 5) {
      console.log(`ALERT: Low stock for ${inventoryItem.name}. Current quantity: ${inventoryItem.quantity}`);
    }

    await inventoryItem.save();

    // 4. Relational Integrity: Create Request
    const request = await Request.create({
      ngo: req.user._id,
      vendor: vendorId,
      inventoryItem: itemId,
      requirement,
      quantity
    });

    // 5. Structured Logging: JSON audit log
    await createAuditLog(
      req.user._id,
      'INSERT',
      'Request',
      request._id,
      {
        requested_quantity: quantity,
        stock_before: oldQuantity,
        stock_after: inventoryItem.quantity,
        inventory_item_id: itemId
      }
    );

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm delivery (NGO)
// @route   PUT /api/requests/:id/confirm-delivery
// @access  Private (NGO)
const confirmDelivery = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('delivery');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 1. Relational Integrity: Update Delivery status & timestamp
    const delivery = await Delivery.findById(request.delivery);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery record not found' });
    }

    const receivedAt = new Date();
    delivery.status = 'delivered';
    delivery.receivedAt = receivedAt;
    await delivery.save();

    // 2. Update Request Status
    request.status = 'delivered';
    request.deliveredAt = receivedAt;
    await request.save();

    // 3. Update Inventory Item status to 'Donated' only if quantity is 0
    const invItem = await Inventory.findById(request.inventoryItem);
    if (invItem && invItem.quantity === 0) {
      invItem.status = 'Donated';
      await invItem.save();
    }

    // 4. Structured Logging: Audit interaction
    await createAuditLog(
      req.user._id,
      'UPDATE',
      'Delivery',
      delivery._id,
      {
        status: 'delivered',
        receivedAt: receivedAt,
        action: 'NGO_CONFIRMED_DELIVERY'
      }
    );

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all requests for NGO or Vendor
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'ngo') {
      requests = await Request.find({ ngo: req.user._id })
        .populate('vendor', 'name email')
        .populate('inventoryItem', 'name category unit')
        .populate('delivery')
        .lean();
    } else {
      requests = await Request.find({ vendor: req.user._id })
        .populate('ngo', 'name email')
        .populate('inventoryItem', 'name category unit')
        .populate('delivery')
        .lean();
    }

    // Attach tracking session / driver info if available
    const requestsWithDriver = await Promise.all(requests.map(async (req) => {
      const session = await TrackingSession.findOne({ requestId: req._id, isActive: true });
      return { ...req, driver: session ? session.driver : null };
    }));

    res.status(200).json(requestsWithDriver);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status (Vendor: approve/dispatch)
// @route   PUT /api/requests/:id
// @access  Private (Vendor)
const updateRequestStatus = async (req, res) => {
  try {
    const { status, trackingId, carrier } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const oldStatus = request.status;
    request.status = status || request.status;

    // Handle Dispatch logic: Create Delivery entity
    if (status === 'dispatched' && oldStatus !== 'dispatched') {
      const delivery = await Delivery.create({
        request: request._id,
        trackingId: trackingId || `TRK-${Date.now()}`,
        carrier: carrier || 'Local Partner'
      });
      request.delivery = delivery._id;

      await createAuditLog(
        req.user._id,
        'INSERT',
        'Delivery',
        delivery._id,
        {
          trackingId: delivery.trackingId,
          carrier: delivery.carrier,
          request_id: request._id
        }
      );

      // --- NEW: Real-time Notification Trigger ---
      // Simulate Webhook/SMS to delivery boy
      console.log(`[EVENT] Order ${request._id} Dispatched!`);
      console.log(`[SMS] Sending SMS to Delivery Boy (+91 9999999999): New order available for pickup! Tracking ID: ${delivery.trackingId}`);
      
      // Emit to Socket.io for immediate NGO notification
      const io = req.app.get('io');
      io.to(request._id.toString()).emit('order-dispatched', {
        requestId: request._id,
        trackingId: delivery.trackingId,
        status: 'dispatched'
      });
    }

    await request.save();

    // Log status change
    if (status && status !== oldStatus) {
      await createAuditLog(
        req.user._id,
        'UPDATE',
        'Request',
        request._id,
        {
          old_status: oldStatus,
          new_status: status,
          action: `VENDOR_${status.toUpperCase()}`
        }
      );
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  confirmDelivery,
  getRequests,
  updateRequestStatus
};
