// routes/auth.js

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const auth    = require('../middleware/auth');
const pool = require('../db'); // 

require('dotenv').config();

const { findUserByName, createUser } = require('../models/userModel');
const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  //check if all inputs are included
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password required' });
    }
    //check if user is already created
    const existing = await findUserByName(email);
    if (existing.length) {
      return res.status(409).json({ message: 'User already exists' });
    }

    //create user with hashed password
    const hashed = await bcrypt.hash(password, 10);
    await createUser(name, email, hashed);

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    //catch all
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /auth/login
router.post('/login', async (req, res) => {
  //check if both email and password were entered
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email & password required' });

  //check if user exists
const result = await findUserByName(email);
const user = result[0]; //return array with user being index 1
  //throw errors if no user exists, or credentials are wrong
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.Password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(//creates a new token
    { userId: user.ID },//payload
    process.env.JWT_SECRET,//use env secret to sign token
    { expiresIn: '2h' }//reauth after 2 hours
  );
  res.json({ token });
});

//Allows fetching of logged in user
router.get('/me', auth, async (req, res) => {
  //try to connect to db and find user
  try {
    const [rows] = await pool.execute(
      'SELECT ID, Name, Email FROM User WHERE ID = ?',
      [req.user.userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' }); //if nothing is returned, there is no user logged in

    res.json(rows[0]);
  } catch (err) { //catching errors
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
