/* ============================================
   CLEARROUTE - VEHICLE ROUTING APPLICATION
   
   This file contains the main application logic for a vehicle routing
   system that uses GraphHopper routing engine with Leaflet maps.
   
   Features:
   - Custom GraphHopper router with vehicle constraints
   - Vehicle management (add, edit, delete)
   - Route management (save, use, delete)
   - User account system
   - Popup-based UI management
   ============================================ */

/* ============================================
   CUSTOM GRAPHHOPPER ROUTER CLASS
   Extends Leaflet Routing Machine to work with GraphHopper
   ============================================ */

// Define a custom GraphHopper router for Leaflet Routing Machine
L.Routing.CustomGraphHopper = L.Class.extend({
    // Constructor: accepts API key (optional) and options like service URL and profile
    initialize: function(apiKey, options) {
        this.options = options || {};
        this.serviceUrl = this.options.serviceUrl || 'http://localhost:8989/route';
        this.profile = this.options.profile || 'truck1'; // Default vehicle profile
    },

    // This method is required by LRM — it builds and sends the routing request
    route: function(waypoints, callback, context, options) {
        // Convert waypoints from L.LatLng objects to [lon, lat] pairs (GraphHopper format)
        const points = waypoints.map(wp => [wp.latLng.lng, wp.latLng.lat]);

        // Extract the height limit from options, default to 1 meter if not provided
        const heightLimit = this.options.heightLimit || 1;

        // Build the request body with custom routing model for vehicle constraints
        const body = {
            profile: this.profile,
            points: points,
            custom_model: {
                distance_influence: 1,
                priority: [
                    {
                        // Avoid routes with height restrictions lower than vehicle height
                        if: `max_height < ${heightLimit}`,
                        multiply_by: "0" // Block these routes completely
                    }
                ]
            },
        };

        // Make the POST request to GraphHopper routing service
        fetch(this.serviceUrl + '?ch=false', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
            // Decode the encoded polyline from GraphHopper response into coordinates
            const encoded = data.paths[0].points;
            const coords = polyline.decode(encoded).map(pt => L.latLng(pt[0], pt[1]));

            // Format the response into the format LRM expects
            const route = {
                name: "", // Optional route name
                coordinates: coords, // The route geometry
                // Route summary information
                summary: {
                    totalDistance: data.paths[0].distance, // Distance in meters
                    totalTime: data.paths[0].time / 1000 // Time in seconds (converted from milliseconds)
                },
                instructions: data.paths[0].instructions || [], // Turn-by-turn directions
                inputWaypoints: waypoints, // Original waypoints from user
                // Snapped waypoints (adjusted to road network)
                actualWaypoints: (
                    data.paths[0].snapped_waypoints &&
                    Array.isArray(data.paths[0].snapped_waypoints.coordinates)
                )
                    ? data.paths[0].snapped_waypoints.coordinates.map(coord =>
                        L.latLng(coord[1], coord[0]) // Convert to Leaflet LatLng format
                    )
                    : waypoints.map(wp => wp.latLng) // Fallback to original waypoints
            };

            // Call the callback that LRM expects to receive with the route data
            callback.call(context, null, [route]);
        })
        .catch(err => {
            console.error("Custom routing failed:", err);
            // Call the callback with an error object if request fails
            callback.call(context, {
                status: -1,
                message: "Routing error"
            });
        });
    }
});

/* ============================================
   MAP INITIALIZATION AND SETUP
   Initialize Leaflet map with routing controls
   ============================================ */

// Initialize the main map centered on Vancouver, BC
var map = L.map('map');

// Add OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create instance of custom GraphHopper router with default settings
var customRouter = new L.Routing.CustomGraphHopper('', {
    serviceUrl: 'http://localhost:8989/route', // Local GraphHopper instance
    profile: 'truck1', // Vehicle profile for truck routing
    heightLimit: 1.2 // Default height limit in meters
});

// Initialize Leaflet Routing Machine control with custom router
let control = L.Routing.control(L.extend(window.lrmConfig, {
	waypoints: [
		L.latLng(49.33, -123.03), // Start point (Vancouver)
		L.latLng(49.25, -122.97)  // End point (Vancouver)
	],
    router: customRouter, // Use our custom GraphHopper router
	geocoder: L.Control.Geocoder.nominatim(), // Address search functionality
	routeWhileDragging: false, // Don't recalculate route while dragging waypoints
	reverseWaypoints: true,
	showAlternatives: true,
	altLineOptions: {
		styles: [
			{color: 'black', opacity: 0.15, weight: 9},
			{color: 'white', opacity: 0.8, weight: 6},
			{color: 'blue', opacity: 0.5, weight: 2}
		]
	}

    
})).addTo(map);

let errorControl = L.Routing.errorControl(control).addTo(map);

//create popup with buttons to set start and destination waypoints
map.on('click', function(e) {
    var container = L.DomUtil.create('div'),
        startBtn = createButton('Start from this location', container),
        destBtn = createButton('Go to this location', container);
    //popup
    L.popup()
        .setContent(container)
        .setLatLng(e.latlng)
        .openOn(map);
    //start button
    L.DomEvent.on(startBtn, 'click', function() {
        control.spliceWaypoints(0, 1, e.latlng);
        map1.closePopup();
    });
    //destination button
    L.DomEvent.on(destBtn, 'click', function() {
        control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
        map1.closePopup();
    });
});

// Store saved routes data for functionality
const savedRoutes = [
    { id: 0, name: "Home to Work", distance: "15.2 km", time: "22 min", height: 5.2 },
    { id: 1, name: "Downtown Shopping", distance: "8.7 km", time: "18 min", height: 2.8 },
    { id: 2, name: "Airport Route", distance: "32.1 km", time: "45 min", height: 5.2 }
];

// Store saved vehicles data for functionality
const savedVehicles = [
    { id: 0, name: "Semi Truck", height: 5.2, weight: 40, width: 2.6 },
    { id: 1, name: "Delivery Van", height: 2.5, weight: 3.5, width: 2.0 },
    { id: 2, name: "Personal Car", height: 1.6, weight: 1.5, width: 1.8 }
];

// Add event listeners for Use Route buttons
document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation for route buttons to handle dynamic changes
    const savedRoutePopupBody = document.querySelector('#saved-route-popup .popup-body');
    
    if (savedRoutePopupBody) {
        savedRoutePopupBody.addEventListener('click', function(e) {
            if (e.target.classList.contains('use-route-btn')) {
                // Find the route item and get its data-route-id
                const routeItem = e.target.closest('.route-item');
                const routeId = parseInt(routeItem.getAttribute('data-route-id'));
                
                // Find the route by ID
                const route = savedRoutes.find(r => r.id === routeId);
                if (route) {
                    // Populate the input fields
                    const heightInput = document.querySelector("input[name='heightIn']");
                    const weightInput = document.querySelector("input[name='weightIn']");
                    const widthInput = document.querySelector("input[name='widthIn']");
                    
                    heightInput.value = route.height;
                    weightInput.value = route.weight || '';
                    widthInput.value = route.width || '';
                    
                    // Close the popup
                    document.getElementById('saved-route-toggle').checked = false;
                }
            } else if (e.target.classList.contains('delete-route-btn')) {
                // Find the route item and get its data-route-id
                const routeItem = e.target.closest('.route-item');
                const routeId = parseInt(routeItem.getAttribute('data-route-id'));
                
                // Find the route by ID
                const route = savedRoutes.find(r => r.id === routeId);
                if (route) {
                    // Update popup for route deletion
                    document.getElementById('delete-popup-title').textContent = 'Delete Route';
                    document.getElementById('delete-confirmation-message').textContent = 'Are you sure you want to delete this route?';
                    
                    // Populate the delete confirmation popup with route info
                    document.getElementById('delete-vehicle-name').textContent = route.name;
                    document.getElementById('delete-vehicle-details').textContent = `Distance: ${route.distance} | Time: ${route.time}`;
                    
                    // Store route data for deletion
                    document.getElementById('confirm-delete-btn').dataset.routeId = routeId;
                    document.getElementById('confirm-delete-btn').dataset.routeType = 'route';
                    
                    // Show the delete confirmation popup
                    document.getElementById('delete-vehicle-toggle').checked = true;
                }
            }
        });
    }
    
    // Use event delegation for vehicle buttons to handle dynamic changes
    const vehiclesPopupBody = document.querySelector('#vehicles-popup .popup-body');
    
    if (vehiclesPopupBody) {
        vehiclesPopupBody.addEventListener('click', function(e) {
            if (e.target.classList.contains('select-vehicle-btn')) {
                // Find the vehicle item and get its data-vehicle-id
                const vehicleItem = e.target.closest('.vehicle-item');
                const vehicleId = parseInt(vehicleItem.getAttribute('data-vehicle-id'));
                
                // Find the vehicle by ID
                const vehicle = savedVehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    // Populate the input fields
                    const heightInput = document.querySelector("input[name='heightIn']");
                    const weightInput = document.querySelector("input[name='weightIn']");
                    const widthInput = document.querySelector("input[name='widthIn']");
                    
                    heightInput.value = vehicle.height;
                    weightInput.value = vehicle.weight || '';
                    widthInput.value = vehicle.width || '';
                    
                    // Close the popup
                    document.getElementById('vehicles-toggle').checked = false;
                }
            } else if (e.target.classList.contains('edit-vehicle-btn')) {
                // Find the vehicle item and get its data-vehicle-id
                const vehicleItem = e.target.closest('.vehicle-item');
                const vehicleId = parseInt(vehicleItem.getAttribute('data-vehicle-id'));
                
                // Find the vehicle by ID
                const vehicle = savedVehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    // Populate the edit form with current vehicle data
                    document.getElementById('edit-vehicle-name').value = vehicle.name;
                    document.getElementById('edit-vehicle-height').value = vehicle.height;
                    document.getElementById('edit-vehicle-weight').value = vehicle.weight || '';
                    document.getElementById('edit-vehicle-width').value = vehicle.width || '';
                    
                    // Store the vehicle ID for later use
                    document.getElementById('edit-vehicle-form').dataset.vehicleId = vehicleId;
                    
                    // Open the edit popup
                    document.getElementById('edit-vehicle-toggle').checked = true;
                }
            } else if (e.target.classList.contains('delete-vehicle-btn')) {
                // Find the vehicle item and get its data-vehicle-id
                const vehicleItem = e.target.closest('.vehicle-item');
                const vehicleId = parseInt(vehicleItem.getAttribute('data-vehicle-id'));
                
                // Find the vehicle by ID
                const vehicle = savedVehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    // Update popup for vehicle deletion
                    document.getElementById('delete-popup-title').textContent = 'Delete Vehicle';
                    document.getElementById('delete-confirmation-message').textContent = 'Are you sure you want to delete this vehicle?';
                    
                    // Populate the delete confirmation popup with vehicle data
                    document.getElementById('delete-vehicle-name').textContent = vehicle.name;
                    document.getElementById('delete-vehicle-details').textContent = `Height: ${vehicle.height}m | Weight: ${vehicle.weight || 'N/A'}t | Width: ${vehicle.width || 'N/A'}m`;
                    
                    // Store vehicle data for deletion
                    document.getElementById('confirm-delete-btn').dataset.vehicleId = vehicleId;
                    document.getElementById('confirm-delete-btn').dataset.vehicleType = 'existing';
                    
                    // Show the delete confirmation popup
                    document.getElementById('delete-vehicle-toggle').checked = true;
                }
            }
        });
    }
});

// Add New Vehicle Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const addVehicleForm = document.getElementById('add-vehicle-form');
    
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('vehicle-name').value.trim();
            const height = parseFloat(document.getElementById('vehicle-height').value);
            const weight = parseFloat(document.getElementById('vehicle-weight').value);
            const width = parseFloat(document.getElementById('vehicle-width').value);
            
            // Validate inputs
            if (!name) {
                alert('Please enter a vehicle name.');
                return;
            }
            
            if (isNaN(height) || height <= 0) {
                alert('Please enter a valid height value.');
                return;
            }
            
            if (isNaN(weight) || weight <= 0) {
                alert('Please enter a valid weight value.');
                return;
            }
            
            if (isNaN(width) || width <= 0) {
                alert('Please enter a valid width value.');
                return;
            }
            
            // Generate a unique ID for the new vehicle
            const nextId = savedVehicles.length > 0 ? Math.max(...savedVehicles.map(v => v.id)) + 1 : 0;
            
            // Add to savedVehicles array
            const newVehicle = {
                id: nextId,
                name: name,
                height: height,
                weight: weight,
                width: width
            };
            savedVehicles.push(newVehicle);
            
            // Create new vehicle item HTML
            const vehicleItem = document.createElement('div');
            vehicleItem.className = 'vehicle-item';
            vehicleItem.setAttribute('data-vehicle-id', nextId);
            vehicleItem.innerHTML = `
                <h3>${name}</h3>
                <p>Height: ${height}m | Weight: ${weight}t | Width: ${width}m</p>
                <div class="vehicle-actions">
                    <button class="select-vehicle-btn">Select</button>
                    <button class="edit-vehicle-btn">Edit</button>
                    <button class="delete-vehicle-btn">Delete</button>
                </div>
            `;
            
            // Add to the vehicles popup body
            const vehiclesPopupBody = document.querySelector('#vehicles-popup .popup-body');
            vehiclesPopupBody.appendChild(vehicleItem);
            
            // Store reference for possible deletion
            window.tempVehicleItem = vehicleItem;
            
            // Clear form and close popup
            addVehicleForm.reset();
            document.getElementById('add-vehicle-toggle').checked = false;
        });
    }
    
    // Edit Vehicle Form Handler
    const editVehicleForm = document.getElementById('edit-vehicle-form');
    
    if (editVehicleForm) {
        editVehicleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get the vehicle ID from the form dataset
            const vehicleId = parseInt(editVehicleForm.dataset.vehicleId);
            
            // Get form values
            const name = document.getElementById('edit-vehicle-name').value.trim();
            const height = parseFloat(document.getElementById('edit-vehicle-height').value);
            const weight = parseFloat(document.getElementById('edit-vehicle-weight').value);
            const width = parseFloat(document.getElementById('edit-vehicle-width').value);
            
            // Validate inputs
            if (!name) {
                alert('Please enter a vehicle name.');
                return;
            }
            
            if (isNaN(height) || height <= 0) {
                alert('Please enter a valid height value.');
                return;
            }
            
            if (isNaN(weight) || weight <= 0) {
                alert('Please enter a valid weight value.');
                return;
            }
            
            if (isNaN(width) || width <= 0) {
                alert('Please enter a valid width value.');
                return;
            }
            
            // Update the vehicle in the savedVehicles array
            const vehicleIndex = savedVehicles.findIndex(vehicle => vehicle.id === vehicleId);
            if (vehicleIndex > -1) {
                savedVehicles[vehicleIndex].name = name;
                savedVehicles[vehicleIndex].height = height;
                savedVehicles[vehicleIndex].weight = weight;
                savedVehicles[vehicleIndex].width = width;
                
                // Find and update the vehicle item in the DOM using data-vehicle-id
                const vehicleItem = document.querySelector(`[data-vehicle-id="${vehicleId}"]`);
                
                if (vehicleItem) {
                    vehicleItem.querySelector('h3').textContent = name;
                    vehicleItem.querySelector('p').textContent = `Height: ${height}m | Weight: ${weight}t | Width: ${width}m`;
                }
            }
            
            // Clear form and close popup
            editVehicleForm.reset();
            document.getElementById('edit-vehicle-toggle').checked = false;
        });
    }
    
    // Delete Vehicle Confirmation Handler
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const vehicleType = this.dataset.vehicleType;
            const routeType = this.dataset.routeType;
            
            if (routeType === 'route') {
                // Handle route deletion
                const routeId = parseInt(this.dataset.routeId);
                
                // Remove the route from the DOM using data-route-id
                const routeItem = document.querySelector(`[data-route-id="${routeId}"]`);
                if (routeItem) {
                    routeItem.remove();
                }
                
                // Find and remove from saved routes array by ID
                const routeIndex = savedRoutes.findIndex(route => route.id === routeId);
                if (routeIndex > -1) {
                    savedRoutes.splice(routeIndex, 1);
                }
                
            } else if (vehicleType === 'existing') {
                // Handle existing vehicle deletion
                const vehicleId = parseInt(this.dataset.vehicleId);
                
                // Remove the vehicle from the DOM using data-vehicle-id
                const vehicleItem = document.querySelector(`[data-vehicle-id="${vehicleId}"]`);
                if (vehicleItem) {
                    vehicleItem.remove();
                }
                
                // Find and remove from saved vehicles array by ID
                const vehicleIndex = savedVehicles.findIndex(vehicle => vehicle.id === vehicleId);
                if (vehicleIndex > -1) {
                    savedVehicles.splice(vehicleIndex, 1);
                }
                
            } else if (vehicleType === 'new') {
                // Handle new vehicle deletion
                const vehicleName = this.dataset.vehicleName;
                
                // Remove the vehicle item from DOM
                if (window.tempVehicleItem) {
                    window.tempVehicleItem.remove();
                }
                
                // Find and remove from saved vehicles array
                const index = savedVehicles.findIndex(v => v.name === vehicleName);
                if (index > -1) {
                    savedVehicles.splice(index, 1);
                }
                
                // Clean up temporary references
                window.tempVehicleItem = null;
                window.tempNewVehicle = null;
            }
            
            // Close the delete confirmation popup
            document.getElementById('delete-vehicle-toggle').checked = false;
        });
    }
});

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page from reloading

    const heightInput = document.querySelector("input[name='heightIn']").value;
    const height = parseFloat(heightInput);
    // const weightInput = document.querySelector("input[name='weightIn']").value;
    // const weight = parseFloat(weightInput);
    // const widthInput = document.querySelector("input[name='widthIn']").value;
    // const width = parseFloat(heightInput);

    if (isNaN(height)) {
        alert("Please enter a valid height in meters.");
        return;
    }
    // else if (isNaN(weight)) {
    //     alert("Please enter a valid weight in tons.");
    //     return;
    // }else if (isNaN(width)) {
    //     alert("Please enter a valid width in meters.");
    //     return;
    // }

    // Remove old control from map
    map.removeControl(control);

    if (errorControl) {
        map.removeControl(errorControl);
    }

    // Create a new custom router with the height limit
    const newCustomRouter = new L.Routing.CustomGraphHopper('', {
        serviceUrl: 'http://localhost:8989/route',
        profile: 'truck1',
        heightLimit: height
    });

    // Recreate routing control with the updated router
    control = L.Routing.control({
        waypoints: [
            L.latLng(49.33, -123.03),
            L.latLng(49.25, -122.97)
        ],
        router: newCustomRouter,
        geocoder: L.Control.Geocoder.nominatim(),
        routeWhileDragging: false,
        reverseWaypoints: true,
        showAlternatives: true,
        altLineOptions: {
            styles: [
                { color: 'black', opacity: 0.15, weight: 9 },
                { color: 'white', opacity: 0.8, weight: 6 },
                { color: 'blue', opacity: 0.5, weight: 2 }
            ]
        }
    }).addTo(map);

    //reattach the error control
    errorControl = L.Routing.errorControl(control).addTo(map);
});

