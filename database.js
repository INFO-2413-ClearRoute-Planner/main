/* ============================================
   DATABASE INITIALIZATION
   Initialize database and HTML Content
   ============================================ */

let apiBase = 'http://localhost:3000'; // Change if deployed
let sessionToken = ''; // Global scope variable

// Store saved vehicles data for functionality
let savedVehicles = [];

document.addEventListener('DOMContentLoaded', function() {
  InitAuthVerification();
  LoginUpdate();
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
  sessionToken = '';
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
  showOutput(data);

  document.getElementById('user-logged-in').checked = true;
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

  LoginUpdate();
}

// Update User Window based on sessionToken 
async function LoginUpdate()
{
  //Checks if Login successfull
  if(typeof sessionToken !== 'undefined' && sessionToken !== '')
  {
    await AccountUpdate();
    document.getElementById('user-logged-in').checked = true;

    await UpdateVehicles();
    await UpdateRouteHistory();
  }
  else
  {
    LogOut();
  }
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
            <button class="use-route-btn">Use Route</button>
            <button class="delete-route-btn" onclick="DeleteRoute(${route.id})">Delete</button>
          </div>
      </div>`;
    })
  } catch (err) {
    showOutput({ error: err.message });
  }
}

async function DeleteRoute(routeID)
{
  // const res = await fetch(`${apiBase}/routes/${routeID}`, {
  //   method: 'DELETE',
  //   headers: {
  //     Authorization: `Bearer ${sessionToken}`
  //   }
  // });

  // if (res.status === 204) {
  //   showOutput({ message: `Route ${routeID} deleted successfully.` });
  //   UpdateRouteHistory();
  // } else {
  //   const err = await res.text();
  //   showOutput({ error: `Failed to delete vehicle: ${res.status} - ${err}` });
  // }

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

  return allRoutes;
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

  const data = await res.json();
  UpdateVehicles(); 
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
    showOutput({ message: `Vehicle ${editVehicleID} updated successfully.` });
    UpdateVehicles();
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
    showOutput({ message: `Vehicle ${vehicleId} deleted successfully.` });
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

// Add functionality for Manage Route & Vehicles Windows 
function InitManageProfiles()
{
  // Route buttons
  const useRouteButtons = document.querySelectorAll('.use-route-btn');
  const deleteRouteButtons = document.querySelectorAll('.delete-route-btn');
  
  // Vehicle buttons
  const selectVehicleButtons = document.querySelectorAll('.select-vehicle-btn');
  const editVehicleButtons = document.querySelectorAll('.edit-vehicle-btn');
  const deleteVehicleButtons = document.querySelectorAll('.delete-vehicle-btn');
  
  // Route functionality
  useRouteButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          // Get the height value for this route
          const routeHeight = savedRoutes[index].height;
          
          // Populate the height input field
          const heightInput = document.querySelector("input[name='heightIn']");
          heightInput.value = routeHeight;
          
          // Close the popup
          document.getElementById('saved-route-toggle').checked = false;
          
          // Optional: Show a confirmation message
          alert(`Route "${savedRoutes[index].name}" selected with height limit: ${routeHeight}m`);
      });
  });
  
  deleteRouteButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          if (confirm(`Are you sure you want to delete "${savedRoutes[index].name}"?`)) {
              // Remove the route from the DOM
              const routeItem = button.closest('.route-item');
              routeItem.remove();
              
              // Remove from saved routes array
              savedRoutes.splice(index, 1);
              
              // Optional: Show confirmation message
              alert('Route deleted successfully!');
          }
      });
  });
}

function showOutput(data) 
{
  alert(JSON.stringify(data, null, 2));
}
