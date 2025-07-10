// db.js
require('dotenv').config();               
const mysql = require('mysql2/promise');  // promise-based MySQL2
const fs    = require('fs');
const path  = require('path');

// Create a pool using your existing .env values (DB_SERVER is your Azure MySQL host,
// DB_NAME is the database, DB_USER/DB_PASSWORD as before)
const pool = mysql.createPool({
  host:     process.env.DB_SERVER,       
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,               // queue up if no free conn
  connectionLimit: 10,                    // max simultaneous conns
  queueLimit: 0,
  ssl: {
    // this flag tells the client “use TLS but don’t validate the server cert”
    rejectUnauthorized: false
  }
});

module.exports = pool;                     // export the pool directly
