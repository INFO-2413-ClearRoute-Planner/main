const express = require('express');
const auth = require('../middleware/auth');
const {
  addUserLocation,
  deleteUserLocation,
  getUserLocations
} = require('../models/userLocationModel');

const router = express.Router();

// GET /userlocations
router.get('/', auth, async (req, res) => {
  const results = await getUserLocations(req.user.userId);
  res.json(results);
});

// POST /userlocations
router.post('/', auth, async (req, res) => {
  const { locationId, name } = req.body;
  await addUserLocation(req.user.userId, locationId, name);
  res.sendStatus(201);
});

// DELETE /userlocations
router.delete('/', auth, async (req, res) => {
  const { locationId } = req.body;
  await deleteUserLocation(req.user.userId, locationId);
  res.sendStatus(204);
});

module.exports = router;
