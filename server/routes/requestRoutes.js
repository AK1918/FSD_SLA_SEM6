const express = require('express');
const router = express.Router();
const { 
  createRequest, 
  confirmDelivery,
  getRequests, 
  updateRequestStatus 
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('ngo'), createRequest)
  .get(protect, getRequests);

router.route('/:id/confirm-delivery')
  .put(protect, authorize('ngo'), confirmDelivery);

router.route('/:id')
  .put(protect, authorize('vendor'), updateRequestStatus);

module.exports = router;
