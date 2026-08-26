const express = require('express');
const router = express.Router();
const {
  getPendingDecisions,
  getAllDecisions,
  approveDecision,
  rejectDecision
} = require('../controllers/decisionController');

router.get('/pending', getPendingDecisions);
router.get('/', getAllDecisions);
router.post('/:id/approve', approveDecision);
router.post('/:id/reject', rejectDecision);

module.exports = router;