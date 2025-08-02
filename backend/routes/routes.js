// routes/routes.js
const express = require('express');
const auth    = require('../middleware/auth');
const {
  getRoutesByUserId,
  createRoute
} = require('../models/routeModel');
const { addStop } = require('../models/routeStopModel');

const router = express.Router();

// GET /routes
router.get('/', auth, async (req, res) => {
  const rows = await getRoutesByUserId(req.user.userId);
  res.json(rows);
});

// POST /routes
router.post('/', auth, async (req, res) => {
  let { name, stops } = req.body;

  if (!name || !Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ error: 'Route name and at least one stop are required' });
  }

  // sanitize
  stops = stops.map((s, i) => ({
    stopNum: s.stopNum ?? i + 1,
    locationId: parseInt(s.locationId, 10)
  })).filter(s => !isNaN(s.locationId));

  try {
    const routeId = await createRoute(req.user.userId, name);
    for (let stop of stops) {
      await addStop(routeId, stop.stopNum, stop.locationId);
    }
    res.status(201).json({ routeId });
  } catch (err) {
    console.error('Failed to create route:', err);
    res.status(500).json({ error: 'Server error creating route' });
  }
});


module.exports = router;
