// Map UI
var map = L.map('map').setView([49.28207317260126, -123.03236951998038], 14);

// Shows the Map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Request for the route
fetch('http://localhost:8989/route?ch=false', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile: 'truck1',
    points: [
      // Here the coordinates have to be swapped
      [-123.02996285956368, 49.279381755743714], 
      [-123.05059137742096, 49.31794469596032]
    ],
    // Here we pas onto the server our custom model
    custom_model: {
      distance_influence: 1,
      priority: [{ if: "max_height < 5", multiply_by: "0" }],
      speed: [{ if: "true", limit_to: "80" }]
    }
  })
})
.then(response => response.json())
.then(data => {
  // Here we create a path from GraphHopper response
  const encoded = data.paths[0].points; 
  const coords = L.Polyline.fromEncoded(encoded).getLatLngs();
  L.polyline(coords, { color: 'blue' }).addTo(map);
})
.catch(err => {
  console.error("Routing failed:", err);
})

// Database Var
let apiBase = 'http://localhost:3000'; // Change if deployed
let sessionToken = '';

// Store saved vehicles data for functionality
let savedVehicles = [];

document.addEventListener('DOMContentLoaded', function() {
  InitAuthVerification();

  LoginUpdate();
});

// LogOut
// NOTE: they are added on HTML onclick directly
async function LogOut()
{
  document.getElementById('user-logged-in').checked = false;
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
    document.getElementById('user-logged-in').checked = true;

    await GetUserVehicles();
    InitManageProfiles();

  }
  else
  {
    LogOut();
  }
}

async function GetUserVehicles()
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
  } catch (err) {
    showOutput({ error: err.message });
  }
}

// NOTE: they are added on HTML onclick directly
// WARNING: Update new input fields
async function AddVehicle()
{
  const res = await fetch(`${apiBase}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      name: 'Moskvitch',
      height: parseFloat(document.getElementById('height').value) || null,
      weightT: parseFloat(document.getElementById('weight').value) || null
    })
  });

  const data = await res.json();
}

// Add Vehicle Item in the list
function AddVehicleHTML(vehicle)
{
  document.getElementById('vehicle-list').innerHTML += `
    <div class="vehicle-item">
      <h3>${vehicle.Name}</h3>
      <p>Height: ${vehicle.Height}m | Weight: ${vehicle.WeightT}t | Width: ${-1}m</p>
      <div class="vehicle-actions">
        <button class="select-vehicle-btn">Select</button>
        <button class="edit-vehicle-btn">Edit</button>
        <button class="delete-vehicle-btn">Delete</button>
      </div>
    </div>
  `;
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

// Add functionality for Manage Route & Vehicles Windows 
function InitManageProfiles()
{
  // Add Vehicle Profiles 
  savedVehicles.forEach(vehicle => {
    showOutput(vehicle);
    AddVehicleHTML(vehicle);
  });

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
  
  // Vehicle functionality
  selectVehicleButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          // Get the values for this vehicle
          const vehicleHeight = savedVehicles[index].Height;
          const vehicleWidth = savedVehicles[index].width;
          const vehicleWeight = savedVehicles[index].WeightT;
          
          // Populate the input field
          document.querySelector("input[name='heightIn']").value = vehicleHeight;
          document.querySelector("input[name='widthIn']").value = vehicleWidth;
          document.querySelector("input[name='weightIn']").value = vehicleWeight;
          
          // Update the vehicle dropdown to show selected vehicle
          // const vehicleSelect = document.querySelector('select');
          // if (vehicleSelect && vehicleSelect.options[index]) {
          //     vehicleSelect.selectedIndex = index;
          // }
          
          // Close the popup
          document.getElementById('vehicles-toggle').checked = false;
          
          // Show confirmation message
          // alert(`Vehicle "${savedVehicles[index].name}" selected with height limit: ${vehicleHeight}m`);
      });
  });
  
  editVehicleButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          const vehicle = savedVehicles[index];
          
          // Simple edit functionality - prompt for new height
          const newHeight = prompt(`Edit height for ${vehicle.name}:`, vehicle.height);
          
          if (newHeight !== null && !isNaN(parseFloat(newHeight))) {
              // Update the vehicle data
              savedVehicles[index].height = parseFloat(newHeight);
              
              // Update the display in the DOM
              const vehicleItem = button.closest('.vehicle-item');
              const vehicleParagraph = vehicleItem.querySelector('p');
              vehicleParagraph.textContent = `Height: ${newHeight}m | Weight: ${vehicle.weight}t | Width: ${vehicle.width}m`;
              
              alert(`Vehicle "${vehicle.name}" updated with new height: ${newHeight}m`);
          } else if (newHeight !== null) {
              alert('Please enter a valid height value.');
          }
      });
  });
  
  deleteVehicleButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
          if (confirm(`Are you sure you want to delete "${savedVehicles[index].Name}"?`)) {
              // Remove the vehicle from the DOM
              const vehicleItem = button.closest('.vehicle-item');
              vehicleItem.remove();
              
              // Remove from saved vehicles array
              savedVehicles.splice(index, 1);
          }
      });
  });
}

function showOutput(data) 
{
  alert(JSON.stringify(data, null, 2));
}
