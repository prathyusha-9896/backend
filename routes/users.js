// In routes/users.js
const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  // Registration logic
  res.send('User Registered');
});

module.exports = router;

// In your main server.js:
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
