const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const app = express();  

// Body parsing middleware
app.use(express.json());  // To parse JSON bodies

// Enable CORS for requests from localhost:3000
const corsOptions = {
  origin: 'http://localhost:3000',  // Allow the frontend to access the backend
  methods: ['GET', 'POST', 'OPTIONS'],  // Allow specific methods (GET, POST, OPTIONS)
  credentials: true,  // Allow credentials (cookies, authorization headers, etc.)
};
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

const oauth2Client = new google.auth.OAuth2(
  '1070666646612-k29u9uttmshfaa1lip3kj9b8pdn4im3j.apps.googleusercontent.com',
  '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',
  'http://localhost:5000/api/auth/google/callback'  // Redirect URI
);

// Google Calendar API route to sync meetings
app.post('/api/sync-calendar', async (req, res) => {
  const { access_token, meetingDateTime, endDateTime, description } = req.body;

  oauth2Client.setCredentials({ access_token });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: 'Scheduled Meeting',
    description,
    start: {
      dateTime: meetingDateTime,
      timeZone: 'UTC',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'UTC',
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.status(200).send({ message: 'Meeting synced with Google Calendar', eventId: response.data.id });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    res.status(500).send('Error syncing with Google Calendar');
  }
});
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

// Availability schema (simplified format)
const Availability = mongoose.model('Availability', new mongoose.Schema({
  userId: { type: String, required: true },
  startTime: { type: String, required: true },  // Example: "2024-10-15T09:00:00Z"
  endTime: { type: String, required: true },    // Example: "2024-10-15T17:00:00Z"
}));

// Availability route (POST) to save availability
app.post('/api/availability', async (req, res) => {
  const { availability } = req.body;

  if (!availability || !Array.isArray(availability)) {
    return res.status(400).json({ message: 'Invalid input: Expected an array of availability records.' });
  }

  try {
    // Save multiple availability records at once
    const savedAvailability = await Availability.insertMany(availability);
    res.status(200).json({ message: 'Availability saved successfully', savedAvailability });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).send('Error saving availability.');
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

// Define the Meeting schema
const Meeting = mongoose.model('Meeting', new mongoose.Schema({
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  hostName: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  createdAt: { type: Date, default: Date.now } // Optional: track when the meeting was created
}));

// POST route to schedule a meeting
app.post('/api/schedule-meeting', async (req, res) => {
  const { userName, userEmail, hostName, date, startTime, endTime } = req.body;

  // Validate the data
  if (!userName || !userEmail || !date || !startTime || !endTime) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Save the meeting details to the database
    const newMeeting = new Meeting({
      userName,
      userEmail,
      hostName,
      date,
      startTime,
      endTime
    });

    await newMeeting.save();

    console.log('Meeting scheduled:', newMeeting);

    // Respond with success
    res.status(200).json({ message: 'Meeting scheduled successfully', newMeeting });
  } catch (error) {
    console.error('Error scheduling the meeting:', error);
    res.status(500).json({ message: 'Server error while scheduling the meeting.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
