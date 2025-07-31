// Define a custom GraphHopper router for Leaflet Routing Machine
L.Routing.CustomGraphHopper = L.Class.extend({
    // Constructor: accepts API key (optional) and options like service URL and profile
    initialize: function(apiKey, options) {
        this.options = options || {};
        this.serviceUrl = this.options.serviceUrl || 'http://localhost:8989/route';
        this.profile = this.options.profile || 'truck1'; // default to 'car' if not provided
    },

    // This method is required by LRM — it builds and sends the routing request
    route: function(waypoints, callback, context, options) {
        // Convert waypoints from L.LatLng objects to [lon, lat] pairs (GraphHopper expects this)
        const points = waypoints.map(wp => [wp.latLng.lng, wp.latLng.lat]);

        // Extract the height limit from options, default to 5 meters if not provided
        const heightLimit = this.options.heightLimit || 1;


        // Build the body for the POST request, including custom_model
        const body = {
            profile: this.profile,
            points: points,
            custom_model: {
                distance_influence: 1,
                priority: [
                    {
                        if: `max_height < ${heightLimit}`,
                        multiply_by: "0"
                    }
                ]
            },
        };

        // Make the POST request to GraphHopper with the custom model
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
                name: "", // optional
                coordinates: coords, // the route geometry
                summary: {
                    totalDistance: data.paths[0].distance, // in meters
                    totalTime: data.paths[0].time // in milliseconds
                },
                instructions: data.paths[0].instructions || [],
                inputWaypoints: waypoints,
                actualWaypoints: (
                    data.paths[0].snapped_waypoints &&
                    Array.isArray(data.paths[0].snapped_waypoints.coordinates)
                )
                    ? data.paths[0].snapped_waypoints.coordinates.map(coord =>
                        L.latLng(coord[1], coord[0])
                    )
                    : waypoints.map(wp => wp.latLng)
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

var map = L.map('map');

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var customRouter = new L.Routing.CustomGraphHopper('', { // create instance of custom router
    serviceUrl: 'http://localhost:8989/route', 
    profile: 'truck1',
    heightLimit: 1.2
});

let control = L.Routing.control(L.extend(window.lrmConfig, {
	waypoints: [
		L.latLng(49.33, -123.03),
		L.latLng(49.25, -122.97)
	],

    router: customRouter,
	geocoder: L.Control.Geocoder.nominatim(),
	routeWhileDragging: false,
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

L.Routing.errorControl(control).addTo(map);

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
    { name: "Home to Work", distance: "15.2 km", time: "22 min", height: 4.1 },
    { name: "Downtown Shopping", distance: "8.7 km", time: "18 min", height: 2.8 },
    { name: "Airport Route", distance: "32.1 km", time: "45 min", height: 5.2 }
];

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

document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault(); // stop the page from reloading

    const heightInput = document.querySelector("input[name='heightIn']").value;
    const height = parseFloat(heightInput);

    if (isNaN(height)) {
        alert("Please enter a valid height in meters.");
        return;
    }

    // Remove old control from map
    map.removeControl(control);

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

    // Reattach the error control (optional)
    L.Routing.errorControl(control).addTo(map);
});

