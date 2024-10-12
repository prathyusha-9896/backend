const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('./models/User'); // User model
const app = express();

// Body parsing middleware
app.use(express.json());  // To parse JSON bodies

// Enable CORS for requests from localhost:3000
const corsOptions = {
  origin: 'http://localhost:3000',  // Allow the frontend to access the backend
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow specific methods (GET, POST, OPTIONS)
  credentials: true,                // Allow credentials (cookies, authorization headers, etc.)
};

// Use CORS middleware
app.use(cors(corsOptions));

// MongoDB connection setup
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/schedulingApp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);  // Exit the server if connection fails
  }
};

// Connect to MongoDB
connectDB();

// Log all incoming requests
app.use((req, res, next) => {
  console.log('Request headers:', req.headers);
  next();
});

// Handle preflight requests (OPTIONS)
app.options('*', cors(corsOptions));

// User registration endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    console.log('User saved to MongoDB:', newUser);
    res.json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('Error storing user in MongoDB:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Availability schema
const Availability = mongoose.model('Availability', new mongoose.Schema({
  userId: { type: String, required: true },
  startTime: String,  // Example: "2024-10-15T09:00:00Z"
  endTime: String,    // Example: "2024-10-15T17:00:00Z"
}));

// Availability route (POST) to save availability
app.post('/api/availability', async (req, res) => {
  const { userId, startTime, endTime } = req.body;

  try {
    const newAvailability = new Availability({ userId, startTime, endTime });
    await newAvailability.save();
    res.send('Availability saved successfully');
  } catch (error) {
    res.status(500).send('Error saving availability');
  }
});

// Route to fetch availability (GET)
app.get('/api/availability/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const availability = await Availability.find({ userId });
    res.json(availability);
  } catch (error) {
    res.status(500).send('Error fetching availability');
  }
});

// Google Calendar API route to sync meetings
app.post('/api/sync-calendar', async (req, res) => {
  const { access_token, meetingDateTime, description } = req.body;

  try {
    const response = await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      start: {
        dateTime: meetingDateTime,  // Scheduled date & time
        timeZone: 'UTC',
      },
      end: {
        dateTime: meetingDateTime,  // End time (adjust as needed)
        timeZone: 'UTC',
      },
      summary: 'Scheduled Meeting',
      description,
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.status(200).send({ message: 'Meeting synced with Google Calendar' });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    res.status(500).send('Error syncing with Google Calendar');
  }
});

// Meeting schema
const Meeting = mongoose.model('Meeting', new mongoose.Schema({
  meetingStartDateTime: { type: String, required: true },
  meetingEndDateTime: { type: String, required: true },
  name: { type: String, required: true }
}));

app.post('/api/meetings', async (req, res) => {
  const { meetingStartDateTime, meetingEndDateTime, name } = req.body;
  
  try {
    console.log('Received meeting details:', req.body); // Log request body
    const newMeeting = new Meeting({ meetingStartDateTime, meetingEndDateTime, name });
    await newMeeting.save();
    
    res.status(200).send({ message: 'Meeting scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).send('Error scheduling meeting');
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
