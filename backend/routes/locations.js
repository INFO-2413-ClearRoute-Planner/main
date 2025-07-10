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
  const { longitude, latitude } = req.body;
  const id = await createLocation(longitude, latitude);
  res.status(201).json({ locationId: id });
});

module.exports = router;
