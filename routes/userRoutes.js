const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Save user profile
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(200).json({ msg: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

module.exports = router;
