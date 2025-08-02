const pool = require('../db');

async function addStop(routeId, stopNum, locationId) {
  await pool.execute(
    'INSERT INTO RouteStops (RouteID, StopNum, LocationID) VALUES (?, ?, ?)',
    [routeId, stopNum, locationId]
  );
}

module.exports = { addStop };
