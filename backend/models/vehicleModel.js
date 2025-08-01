// models/vehicleModel.js
const pool = require('../db');

// Fetch all vehicles for a user
async function getVehiclesByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT VehicleID, Name, Height, WeightT, width FROM Vehicle WHERE UserID = ?',
    [userId]
  );
  return rows;
}

//Insert a new vehicle
async function createVehicle(userId, name, height, weightT, width) {
  const [result] = await pool.execute(
    'INSERT INTO Vehicle (UserID, Name, Height, WeightT, width) VALUES (?, ?, ?, ?, ?)',
    [userId, name, height ?? null, weightT ?? null, width ?? null]
  );
  return result.insertId;
}


//Update an existing vehicle
async function updateVehicle(vehicleId, userId, name, height, weightT, width) { 
  await pool.execute(
    `UPDATE Vehicle
     SET Name   = ?,
         Height = ?,
         WeightT= ?,
         Width  = ?
     WHERE VehicleID = ?
       AND UserID    = ?`,
    [name, height, weightT, width, vehicleId, userId]
  );
}

//Delete a vehicle
async function deleteVehicle(vehicleId, userId) {
  await pool.execute(
    'DELETE FROM Vehicle WHERE VehicleID = ? AND UserID = ?',
    [vehicleId, userId]
  );
}

module.exports = {
  getVehiclesByUserId,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
