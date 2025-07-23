const express = require('express');
const { createJobRequest, updateJobStatus, getMyJobs } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/hire', protect, createJobRequest);
router.get('/myjobs', protect, getMyJobs);
router.patch('/:id/status', protect, updateJobStatus);

module.exports = router;