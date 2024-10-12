const express = require('express');
const { scheduleAppointment } = require('../controllers/appointmentController');
const protect = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, scheduleAppointment);

module.exports = router;
