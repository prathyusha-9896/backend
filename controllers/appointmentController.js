const Appointment = require('../models/Appointment');

// Schedule appointment
const scheduleAppointment = async (req, res) => {
    const { date, time, duration, timezone } = req.body;
    const appointment = new Appointment({
        user: req.user.id, date, time, duration, timezone
    });
    await appointment.save();
    res.status(201).json({ message: 'Appointment scheduled successfully' });
};
