const express = require('express');
const router = express.Router();
const { 
  getInventory, 
  addInventoryItem, 
  deleteInventoryItem,
  getInventoryStats
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getInventory)
  .post(protect, authorize('vendor'), addInventoryItem);

router.route('/stats')
  .get(protect, authorize('vendor'), getInventoryStats);

router.route('/:id')
  .delete(protect, authorize('vendor'), deleteInventoryItem);

module.exports = router;
