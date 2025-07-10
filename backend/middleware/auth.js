// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); //load JSON web token

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; //Reads auth header
  const token = authHeader && authHeader.split(' ')[1];// Expect: "Bearer <token>"
  if (!token) return res.sendStatus(401); //If no token > unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403); //if invalid token > Forbidden
    req.user = { userId: payload.userId }; //Attaching decoded userID
    next();                                //next route handler
  });
}

module.exports = authenticateToken;
