// models/userModel.js
const pool = require('../db');

// query for users by email
async function findUserByName(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM `User` WHERE `Email` = ?',
    [email]
  );
  return rows;
}

// query for users by id
async function findUserById(id) {
  const [rows] = await pool.execute(
    'SELECT * FROM `User` WHERE `ID` = ?',
    [id]
  );
  return rows;
}

//create user based on name, email and hashed pwd
async function createUser(name, email, hashedPassword) {
  const [result] = await pool.execute(
    'INSERT INTO `User` (`Name`,`Email`,`Password`) VALUES (?,?,?)',
    [name, email, hashedPassword]
  );
  return result.insertId;  // new ID
}

module.exports = {
  findUserByName,
  findUserById,
  createUser
};
