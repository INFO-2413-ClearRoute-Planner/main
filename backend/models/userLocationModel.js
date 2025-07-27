const pool = require('../db');

// Add a user-location mapping
async function addUserLocation(userId, locationId, name) {
  await pool.execute(
    'INSERT INTO userslocations (UserID, LocationID, Name) VALUES (?, ?, ?)',
    [userId, locationId, name]
  );
}

// Delete a user-location mapping
async function deleteUserLocation(userId, locationId) {
  await pool.execute(
    'DELETE FROM userslocations WHERE UserID = ? AND LocationID = ?',
    [userId, locationId]
  );
}

// Optional: fetch all saved locations for user
async function getUserLocations(userId) {
  const [rows] = await pool.execute(
    `SELECT ul.LocationID, ul.Name, l.Latitude, l.Longitude
     FROM userslocations ul
     JOIN location l ON ul.LocationID = l.ID
     WHERE ul.UserID = ?`,
    [userId]
  );
  return rows;
}

module.exports = {
  addUserLocation,
  deleteUserLocation,
  getUserLocations
};
