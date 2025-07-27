// models/routeStopModel.js
const pool = require('../db');

// add one stop to a route
async function addStop(routeId, stopNum, locationId) {
  await pool.execute(
    'INSERT INTO RouteStops (RouteID, StopNum, LocationID) VALUES (?,?,?)',
    [routeId, stopNum, locationId]
  );
}

module.exports = { addStop };
