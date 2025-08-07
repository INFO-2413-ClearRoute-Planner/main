// models/routeModel.js
const pool = require('../db');

// get routes for a user
async function getRoutesByUserId(userId) {
  const [rows] = await pool.query(`
    SELECT 
      r.RouteID, r.Name AS RouteName,
      rs.StopNum, rs.LocationID,
      l.Longitude, l.Latitude
    FROM Route r
    LEFT JOIN RouteStops rs ON r.RouteID = rs.RouteID
    LEFT JOIN Location l    ON rs.LocationID = l.ID
    WHERE r.UserID = ?
    ORDER BY r.RouteID, rs.StopNum
  `, [userId]);
  return rows;
}
//Delete a route by ID
async function deleteRoute(userId, routeId) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT * FROM route WHERE RouteID = ? AND UserID = ?',
      [routeId, userId]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return false;
    }
    
    await conn.execute('DELETE FROM routestops WHERE RouteID = ?', [routeId]);
    await conn.execute('DELETE FROM route WHERE RouteID = ?', [routeId]);

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}


// create the base route

async function createRoute(userId, name) {
  const [result] = await pool.execute(
    'INSERT INTO Route (UserID, Name) VALUES (?, ?)',
    [userId, name]
  );
  return result.insertId;
}


module.exports = {
  getRoutesByUserId,
  createRoute,
  deleteRoute
};
