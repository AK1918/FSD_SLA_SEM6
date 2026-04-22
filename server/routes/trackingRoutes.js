const express = require('express');
const router = express.Router();
const { 
  createSession, 
  updateLocation, 
  terminateSession,
  getSession
} = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('vendor'), createSession);
router.put('/:id/location', updateLocation);
router.post('/:requestId/terminate', protect, authorize('ngo'), terminateSession);
router.get('/:requestId', protect, getSession);

module.exports = router;
