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

// Store saved vehicles data for functionality
const savedVehicles = [
    { name: "Semi Truck", height: 4.1, weight: 40, width: 2.6 },
    { name: "Delivery Van", height: 2.5, weight: 3.5, width: 2.0 },
    { name: "Personal Car", height: 1.6, weight: 1.5, width: 1.8 }
];

// Add event listeners for Use Route buttons
document.addEventListener('DOMContentLoaded', function() {
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
            // Get the height value for this vehicle
            const vehicleHeight = savedVehicles[index].height;
            
            // Populate the height input field
            const heightInput = document.querySelector("input[name='heightIn']");
            heightInput.value = vehicleHeight;
            
            // Update the vehicle dropdown to show selected vehicle
            const vehicleSelect = document.querySelector('select');
            if (vehicleSelect && vehicleSelect.options[index]) {
                vehicleSelect.selectedIndex = index;
            }
            
            // Close the popup
            document.getElementById('vehicles-toggle').checked = false;
            
            // Show confirmation message
            alert(`Vehicle "${savedVehicles[index].name}" selected with height limit: ${vehicleHeight}m`);
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
            if (confirm(`Are you sure you want to delete "${savedVehicles[index].name}"?`)) {
                // Remove the vehicle from the DOM
                const vehicleItem = button.closest('.vehicle-item');
                vehicleItem.remove();
                
                // Remove from saved vehicles array
                savedVehicles.splice(index, 1);
                
                // Show confirmation message
                alert('Vehicle deleted successfully!');
            }
        });
    });
});

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