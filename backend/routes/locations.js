// routes/locations.js
const express = require('express');
const auth    = require('../middleware/auth');
const { getAllLocations, createLocation } = require('../models/locationModel');

const router = express.Router();

// GET /locations
router.get('/', auth, async (req, res) => {
  const list = await getAllLocations();
  res.json(list);
});

// POST /locations
router.post('/', auth, async (req, res) => {
  const {longitude, latitude } = req.body;

  if (!longitude || !latitude) {
    return res.status(400).json({ error: 'Missing longitude, or latitude' });
  }

  try {
    const id = await createLocation(name, longitude, latitude);
    res.status(201).json({ locationId: id });
  } catch (err) {
    console.error('Error creating location:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
