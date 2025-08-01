// routes/vehicles.js
const express = require('express');
const auth    = require('../middleware/auth');
const {
  getVehiclesByUserId,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../models/vehicleModel');

const router = express.Router();


// GET /vehicles
router.get('/', auth, async (req, res) => {
  const list = await getVehiclesByUserId(req.user.userId);
  res.json(list);
});

// POST /vehicles
router.post('/', auth, async (req, res) => {
  const { name, height, weightT, width } = req.body;
  const id = await createVehicle(req.user.userId, name, height, weightT, width);
  res.status(201).json({ vehicleId: id });
});

// PUT /vehicles/:id
router.put('/:id', auth, async (req, res) => {
  const { name, height, weightT, width } = req.body;
  await updateVehicle(parseInt(req.params.id,10), req.user.userId, name, height, weightT, width);
  res.sendStatus(204);
});

// DELETE /vehicles/:id
router.delete('/:id', auth, async (req, res) => {
  await deleteVehicle(parseInt(req.params.id,10), req.user.userId);
  res.sendStatus(204);
});

module.exports = router;
