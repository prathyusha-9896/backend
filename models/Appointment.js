const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    timezone: { type: String, required: true },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
