// models/locationModel.js
const pool = require('../db');

// fetch all locations
async function getAllLocations() {
  //Connect to db and then query
  const [rows] = await pool.query(
    'SELECT ID, Longitude, Latitude FROM Location'
  );
  return rows;
}

// insert a new location
async function createLocation(longitude, latitude) {
  //connect to db and then add
  const [result] = await pool.execute(
    'INSERT INTO Location (Longitude, Latitude) VALUES (?, ?)',
    [longitude, latitude]
  );
  return result.insertId;
}

//exports
module.exports = {
  getAllLocations,
  createLocation
};
