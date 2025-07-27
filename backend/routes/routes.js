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
// body: { name: string, stops: [ { stopNum, locationId }, ... ] }
router.post('/', auth, async (req, res) => {
  const { name, stops } = req.body;
  const routeId = await createRoute(req.user.userId, name);

  // insert stops
  for (let s of stops) {
    await addStop(routeId, s.stopNum, s.locationId);
  }

  res.status(201).json({ routeId });
});

module.exports = router;
