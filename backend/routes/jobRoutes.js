const express = require('express');
const { createJobRequest, updateJobStatus, getMyJobs } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { validate, hireSchema, updateJobStatusSchema } = require('../middleware/validation');

const router = express.Router();

router.post('/hire', protect, validate(hireSchema), createJobRequest);
router.get('/myjobs', protect, getMyJobs);
router.patch('/:id/status', protect, validate(updateJobStatusSchema), updateJobStatus);

module.exports = router;