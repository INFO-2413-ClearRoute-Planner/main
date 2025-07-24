// index.js
require('dotenv').config();
const express = require('express');
const authRoutes     = require('./routes/auth');
const vehicleRoutes  = require('./routes/vehicles');
const locationRoutes = require('./routes/locations');
const routeRoutes    = require('./routes/routes');
const userLocationRoutes = require('./routes/userLocations');



const cors = require('cors');//import cors
const app = express();//express app

app.use(cors());
app.use(express.json());

app.use('/auth',      authRoutes);
app.use('/vehicles',  vehicleRoutes);
app.use('/locations', locationRoutes);
app.use('/routes',    routeRoutes);
app.use('/userlocations', userLocationRoutes);

console.log("index.js loaded");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
