const Inventory = require('../models/Inventory');
const updateInventoryStatus = require('../utils/updateInventoryStatus');
const createAuditLog = require('../utils/auditLogger');

// @desc    Get all inventory
// @route   GET /api/inventory
// @access  Public
const getInventory = async (req, res) => {
  try {
    await updateInventoryStatus();
    // If user is a vendor, only show their items. If NGO or public, show all.
    let query = {};
    if (req.user && req.user.role === 'vendor') {
      query = { vendor: req.user._id };
    }
    const inventory = await Inventory.find(query).populate('vendor', 'name email').sort({ expirationDate: 1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new inventory item
// @route   POST /api/inventory
// @access  Public
const addInventoryItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, expirationDate, price } = req.body;
    
    // Basic status check based on date
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    
    let status = 'Fresh';
    if (diffDays < 0) status = 'Expired';
    else if (diffDays <= 3) status = 'Expiring Soon';

    const newItem = await Inventory.create({
      name,
      category,
      quantity,
      unit,
      expirationDate,
      price: price || 0,
      status,
      vendor: req.user._id
    });

    await createAuditLog(req.user._id, 'INSERT', 'Inventory', newItem._id, { 
      name: newItem.name, 
      quantity: newItem.quantity 
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Public
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const itemId = item._id;
    const itemName = item.name;
    
    await item.deleteOne();

    await createAuditLog(req.user._id, 'DELETE', 'Inventory', itemId, { 
      name: itemName,
      action: 'VENDOR_DELETED_ITEM'
    });

    res.status(200).json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory stats (Basic Data Science)
// @route   GET /api/inventory/stats
// @access  Public
const getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
          expiredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Expired'] }, 1, 0] }
          }
        }
      }
    ]);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  addInventoryItem,
  deleteInventoryItem,
  getInventoryStats
};
