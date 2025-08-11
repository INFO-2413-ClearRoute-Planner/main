/* ============================================
   DATABASE INITIALIZATION
   Initialize database and HTML Content
   ============================================ */

let apiBase = 'http://localhost:3000'; // Change if deployed
let sessionToken = ''; // Global scope variable
const locationGroup = L.layerGroup();



// Store saved vehicles data for functionality
let savedVehicles = [];

document.addEventListener('DOMContentLoaded', function() {

  //Enables persistent session token
  sessionToken = localStorage.getItem('cr_token') || '';

  InitAuthVerification();
  locationGroup.addTo(map);
  LoginUpdate();
  InitSaveRouteButtons();
});

// Editing form submit buttons to prevent page reload 
document.getElementById('add-vehicle-form').addEventListener('submit', function(event) {
  event.preventDefault();
  AddVehicle();
});

document.getElementById('edit-vehicle-form').addEventListener('submit', function(event) {
  event.preventDefault();
  EditVehicle();
});

document.getElementById('save-route-form').addEventListener('submit', function(event) {
  event.preventDefault();
  saveCurrentRoute(false);
});

//save button init on the history route popup
function InitSaveRouteButtons() {
    //get toggle that will show/hide route history popup
    const historyToggle = document.getElementById('history-route-toggle');
    //get save current route button in the history route popup
    const saveCurrentBtn = document.querySelector('#history-route-popup .add-new-btn');
    if (saveCurrentBtn) {
        saveCurrentBtn.addEventListener('click', async () => {
          //save current route
            await saveCurrentRoute(true);
            //refresh route history list to show the new route
            historyToggle.checked = true;
        });
    }

    if (historyToggle) {
      //whenever history toggle opened or closed
        historyToggle.addEventListener('change', (e) => {
          //refresh route history list
            if (e.target.checked) UpdateRouteHistory();
        });
    }
}


// Add functionality for Authentication (Login & Register)
function InitAuthVerification()
{
  //Validate Full Name
  document.getElementById("registerName").addEventListener("input", function() {
    const name = this.value.trim();
    const error = document.getElementById("nameError");

    if (name === "" || !/^[A-Za-z\s]+$/.test(name)) {
        error.textContent = "Only letters and spaces allowed.";
    } 
    else {
        error.textContent = "";
    }
  });

  //Validate Email
  document.getElementById("registerEmail").addEventListener("input", function() {
    const email = this.value.trim();
    const error = document.getElementById("emailError");
    const pattern = /\S+@\S+\.\S+/;

    error.textContent = pattern.test(email) ? "" : "Invalid email format.";
  });

  //Validate Password
  document.getElementById("registerPassword").addEventListener("input", function() {
    const password = this.value;
    const error = document.getElementById("passwordError");

    // At least 1 upper case and 1 symbol and 8 characters long
    const passwordPattern = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(password)) {
        error.textContent = "Password must be at least 8 characters long and include 1 symbol & 1 uppercase  letter. ";
    }
    else {
        error.textContent = "";
    }
  });

  //Validate Confirm Password
  document.getElementById("registerConfirm").addEventListener("input", function() {
    const confirm = this.value;
    const password = document.getElementById("registerPassword").value;
    const error = document.getElementById("confirmPassError");

    error.textContent = confirm === password ? "" : "Password do not match.";
  });
}

/* ============================================
   ACCOUNT DATABASE
   Manages Account & DB interactions
   ============================================ */

// LogOut
// NOTE: they are added on HTML onclick directly
async function LogOut()
{
  document.getElementById('user-logged-in').checked = false;
  document.getElementById('vehicle-list').innerHTML = ``;
  document.getElementById('history-route-list').innerHTML = ``;
  locationGroup.clearLayers();
  sessionToken = '';
  //clear session token from localStorage
  localStorage.removeItem('cr_token');
}

// CreateAccount
// NOTE: they are added on HTML onclick directly
async function CreateAccount()
{
  const res = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('registerName').value,
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value
    })
  });

  const data = await res.json();
  // showOutput(data);
}

// Login Account
// NOTE: they are added on HTML onclick directly
async function LoginAccount()
{
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value
    })
  });

  const data = await res.json();
  sessionToken = data.token;

  if (sessionToken) localStorage.setItem('cr_token', sessionToken); // Store session token in localStorage

  LoginUpdate();
}

// Update User Window based on sessionToken 
async function LoginUpdate()
{
  if(!IsLoggedIn())
  {
    LogOut();
    return;
  }

  await AccountUpdate();
  await UpdateVehicles();
  await UpdateRouteHistory();
  await UpdateLocations();

  document.getElementById('user-logged-in').checked = true;
}

// Update User Informations
async function AccountUpdate()
{
  const res = await fetch('http://localhost:3000/auth/me', {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });

  const data = await res.json();

  document.getElementById('user-info-name').innerHTML = data.Name;
  document.getElementById('user-info-email').innerHTML = data.Email;
}

// Checks whether user logged in
function IsLoggedIn()
{
  let isLogged = (typeof sessionToken !== 'undefined' && sessionToken !== '');
  // if(!isLogged) {alert("Not Logged In. Skipping.");}

  return isLogged;
}

/* ============================================
   ROUTE DATABASE
   Manages Routes & DB interactions
   Saving Route into DB is in routing.js
   ============================================ */

async function UpdateRouteHistory()
{
  document.getElementById('history-route-list').innerHTML = ``;
  
  try {
    const res = await fetch(`${apiBase}/routes`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${error}`);
    }

    const data = await res.json();
    let formattedRoutes = FormatRoute(data);

    formattedRoutes.forEach(route => {
      let directionsText = `${route.stops[0].Lon}, ${route.stops[0].Lat}`;
      for(let i = 1;i<route.stops.length;i++)
      {
        directionsText += ` to ${route.stops[i].Lon}, ${route.stops[i].Lat}`
      }

      document.getElementById('history-route-list').innerHTML += `
      <div class="route-item">
          <h3>${route.name}</h3>
          <p>${directionsText}</p>
          <div class="route-actions">
            <button class="use-route-btn" data-stops='${JSON.stringify(route.stops)}')">Use Route</button>
            <button class="delete-route-btn" onclick="DeleteRoute(${route.id})">Delete</button>
          </div>
      </div>`;

      SetUseRouteButtons();
    })
  } catch (err) {
    showOutput({ error: err.message });
  }
}

function SetUseRouteButtons()
{
  document.querySelectorAll('.use-route-btn').forEach(button => {
  button.addEventListener('click', () => {
    const stops = JSON.parse(button.getAttribute('data-stops'));
    const newWaypoints = [];

    stops.forEach(stop => {
      newWaypoints.push(L.latLng(stop.Lat, stop.Lon));
    });

    control.setWaypoints(newWaypoints);
    document.getElementById('history-route-toggle').checked = false;
  });
});
}

async function DeleteRoute(routeID)
{
  const res = await fetch(`${apiBase}/routes/${routeID}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sessionToken}`
    }
  });

  if (res.status === 200) {
    // showOutput({ message: `Route ${routeID} deleted successfully.` });
    UpdateRouteHistory();
  } else {
    const err = await res.text();
    showOutput({ error: `Failed to delete route: ${res.status} - ${err}` });
  }
}

function FormatRoute(data)
{
  let allStops = data;
  let allRoutes = [];

  let currentRouteName;
  let currentRouteID = allStops[0].RouteID;
  let currentRouteStops = [];

  allStops.forEach(stop => {
    if(stop.RouteID != currentRouteID)
    {
      allRoutes.push({id: currentRouteID, name: currentRouteName, stops: currentRouteStops});
      currentRouteStops = [];
    }

    currentRouteID = stop.RouteID;
    currentRouteName = stop.RouteName;
    currentRouteStops.push({Lon: stop.Longitude, Lat: stop.Latitude});
  })
    //push the last route
    allRoutes.push({ id: currentRouteID, name: currentRouteName, stops: currentRouteStops });


  return allRoutes;
}

/* ============================================
   LOCATION DATABASE
   Manages Location & DB interactions
   Saving Locations into DB is in routing.js
   ============================================ */

async function UpdateLocations()
{
  // Clear all markers
  locationGroup.clearLayers();

  const res = await fetch(`${apiBase}/userlocations`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  });

  // Set up map location markers
  let locations = await res.json();
  locations.forEach(location => {
    let marker = L.marker([location.Latitude, location.Longitude]).addTo(locationGroup);

    marker.bindPopup(`
      <div>
        <h1>${location.Name}</h1>
        <button class="popup-btn" onclick="DeleteLocation(${location.LocationID})">Delete</button>
        <button class="popup-btn" onclick="UseLocation(${location.Latitude}, ${location.Longitude})">Use As Start</button>
      </div>
    `);
  });
}

function UseLocation(Lat, Lon)
{
  let newWaypoints = [];
  newWaypoints.push(L.latLng(Lat, Lon));
  newWaypoints.push(control.getWaypoints()[1]);

  control.setWaypoints(newWaypoints);
}

async function DeleteLocation(locationID)
{
  const res = await fetch(`${apiBase}/userlocations`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      locationId: parseInt(locationID, 10)
    })
  });

  UpdateLocations();
}

/* ============================================
   VEHICLE DATABASE
   Manages Vehicle & DB interactions
   ============================================ */

// Gets Vehicles from the DB. Show vehicles and updates internal array
async function UpdateVehicles()
{
  try {
    const res = await fetch(`${apiBase}/vehicles`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Fetch failed: ${res.status} ${res.statusText} - ${error}`);
    }

    const data = await res.json();
    savedVehicles = data;
  
    // Update Vehicle Profiles 
    let i = 0;
    document.getElementById('vehicle-list').innerHTML = ``;
    savedVehicles.forEach(vehicle => {
      AddVehicleHTML(vehicle, i);
      i++;
    });

  } catch (err) {
    showOutput({ error: err.message });
  }
}

async function AddVehicle()
{
  if(!IsLoggedIn())
  {
    return;
  }

  const res = await fetch(`${apiBase}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      name: document.getElementById('vehicle-name').value,
      height: parseFloat(document.getElementById('vehicle-height').value) || null,
      weightT: parseFloat(document.getElementById('vehicle-weight').value) || null,
      width: parseFloat(document.getElementById('vehicle-width').value) || null
    })
  });

  // const data = await res.json();
  UpdateVehicles(); 

  //Close form popup
  document.getElementById('add-vehicle-toggle').checked = false;

}

// Add Vehicle Item in the list
function AddVehicleHTML(vehicle, index)
{
  document.getElementById('vehicle-list').innerHTML += `
    <div class="vehicle-item">
      <h3>${vehicle.Name}</h3>
      <p>Height: ${vehicle.Height}m | Weight: ${vehicle.WeightT}t | Width: ${vehicle.width}m</p>
      <div class="vehicle-actions">
        <button class="select-vehicle-btn" onclick="SelectVehicle(${index})">Select</button>
        <button class="edit-vehicle-btn" onclick="SetupEditWindow(${vehicle.VehicleID})">Edit</button>
        <button class="delete-vehicle-btn" onclick="DeleteVehicle(${vehicle.VehicleID}, ${index})">Delete</button>
      </div>
    </div>
  `;
}

/* ============================================
   VEHICLE ITEMS
   Manages Vehicle Items Individual actions
   ============================================ */
let editVehicleID = 0;

// Setup Edit Window for selected vehicle
function SetupEditWindow(vehicleID)
{
  document.getElementById('edit-vehicle-toggle').checked = true;
  editVehicleID = vehicleID;
}

// Edit Vehicle
async function EditVehicle()
{
  const name = document.getElementById('edit-vehicle-name').value;
  const heightRaw = document.getElementById('edit-vehicle-height').value;
  const weightRaw = document.getElementById('edit-vehicle-weight').value;
  const widthRaw = document.getElementById('edit-vehicle-width').value;

  // Parse as float or set to null explicitly
  const height = heightRaw === '' ? null : parseFloat(heightRaw);
  const weightT = weightRaw === '' ? null : parseFloat(weightRaw);
  const width = widthRaw === '' ? null : parseFloat(widthRaw);

  if (isNaN(editVehicleID) || !name) {
    showOutput({ error: 'Please enter a valid vehicle ID and name' });
    return;
  }

  const res = await fetch(`${apiBase}/vehicles/${editVehicleID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`
    },
    body: JSON.stringify({ name, height, weightT, width })
  });

  if (res.status === 204) {
    // showOutput({ message: `Vehicle ${editVehicleID} updated successfully.` });
    UpdateVehicles();

    //Close the edit popup
    document.getElementById('edit-vehicle-toggle').checked = false;
  } else {
    const err = await res.text();
    showOutput({ error: `Failed to update vehicle: ${res.status} - ${err}` });
  }
}

// Remove Vehicle from DB and HTML
async function DeleteVehicle(vehicleIDStr, index)
{
  if (!confirm(`Are you sure you want to delete "${savedVehicles[index].Name}"?`)) {return;}

  const vehicleId = parseInt(vehicleIDStr, 10);
  if (isNaN(vehicleId)) {
    showOutput({ error: 'Please enter a valid vehicle ID' });
    return;
  }

  const res = await fetch(`${apiBase}/vehicles/${vehicleId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${sessionToken}`
    }
  });

  if (res.status === 204) {
    // showOutput({ message: `Vehicle ${vehicleId} deleted successfully.` });
    UpdateVehicles();
  } else {
    const err = await res.text();
    showOutput({ error: `Failed to delete vehicle: ${res.status} - ${err}` });
  }
}

// Input Data into route form
function SelectVehicle(index) 
{
  // Get the values for this vehicle
  const vehicleHeight = savedVehicles[index].Height;
  const vehicleWidth = savedVehicles[index].width;
  const vehicleWeight = savedVehicles[index].WeightT;
  
  // Populate the input field
  document.querySelector("input[name='heightIn']").value = vehicleHeight;
  document.querySelector("input[name='widthIn']").value = vehicleWidth;
  document.querySelector("input[name='weightIn']").value = vehicleWeight;
  
  // Close the popup
  document.getElementById('vehicles-toggle').checked = false;
  
  // Show confirmation message
  // alert(`Vehicle "${savedVehicles[index].name}" selected with height limit: ${vehicleHeight}m`);
}

// ---------------------------------------->
// RESERVE ----------------------------------->
// ---------------------------------------->

function showOutput(data) 
{
  alert(JSON.stringify(data, null, 2));
}
