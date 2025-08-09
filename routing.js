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
	initialize: function(apiKey, options) {
        this.options = options || {};
		this.serviceUrl = this.options.serviceUrl || 'http://localhost:8989/route';
		this.profile = this.options.profile || 'truck1'; // Default vehicle profile
	},

	// This method is required by LRM — it builds and sends the routing request
	route: function(waypoints, callback, context, options) {
		// Convert waypoints from Lat-Lng objects to Lng-Lat (cause GraphHopper expects Lng-Lat)
		const points = waypoints.map(wp => [wp.latLng.lng, wp.latLng.lat]);

		// Get height, weight, width, default to 1
		const heightLimit = this.options.heightLimit || 1; //1m
		const weightLimit = this.options.weightLimit || 1; //1t
		const widthLimit = this.options.widthLimit || 1; //1m

		// Build the request body with custom routing model for vehicle constraints
		const body = {
			profile: this.profile,
			points: points,
			custom_model: {
				distance_influence: 1,
				priority: [ 
					{ //Avoid routes with height, weight, width limits
						if: `max_height < ${heightLimit}`,
						multiply_by: "0"
					},
					{
						if: `max_weight < ${weightLimit}`,
						multiply_by: "0"
					},
					{
						if: `max_width < ${widthLimit}`,
						multiply_by: "0"
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
				name: "", 
				coordinates: coords, // The route geometry
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
   Save Location Function
	
   ============================================ */

async function saveLocation() 
{
	if(!IsLoggedIn()) {
		return;
	}

	let name = prompt("Name of Location:");
    let location = control.getWaypoints()[0];

	//Send a post request to store coordinates in DB
	const locationRes = await fetch(`${apiBase}/locations`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${sessionToken}`
		},
		body: JSON.stringify({ latitude: location.latLng.lat, longitude: location.latLng.lng })
	});
	
	//Exit if something goes wrong
	if (!locationRes.ok) {
		// If token is expired/invalid, silently stop saving
		alert(`Location ${i} failed: ${locationRes.status}`);
		return;
	}

	//Parse response to get the new location ID
	const locationData = await locationRes.json();
	
	const res = await fetch(`${apiBase}/userlocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      locationId: parseInt(locationData.locationId, 10),
      name: name
    })
  	});

  	// showOutput(await res.json());
	await UpdateLocations();
}

/* ============================================
   Save Current Route Function
	This function saves the current route, eventually to the database, but for now just logs it
	The parameter AutoRoute is a bool used to determine if the route is automatically generated or manually set
	which will determine whether the name of the route is just the date and time (AutoRoute = true), 
	or a user defined name (AutoRoute = false)
   ============================================ */
/* TO-DO in saveCurrentRoute--
	-get user ID
	-get route name from input field
	-get most recent route ID from the database
	-create entry in tables (route, location, routeStops)
*/

// This function saves the current route to the database
// Click "Reroute" and this function will autorun
// If user is not signed in the function exits early and no data is saved
// sessionToken is taken from database.js
async function saveCurrentRoute(AutoRoute) {
	//If no token, user is not signed in — skip DB save
	if (!IsLoggedIn()) {
		return;
	}

	//define variables for route table entry
	//get user ID from session or context (placeholder for now)--
	let routeName = "";
	if (AutoRoute == true) {
		// If AutoRoute is true, generate a name based on the current date and time
		routeName = new Date().toLocaleString();
	} else {
		// If AutoRoute is false, get the name from the input field(placeholder for now)--
		routeName = document.getElementById('route-name').value; // Replace with actual input field value
	}

    //route creation
    // Get the current waypoints
    let currentWaypoints = control.getWaypoints();
    let stops = []; // define the array to push stop info

    //Loop through each waypoint to save its coordinates as a new `location` in the DB
	for (let i = 0; i < currentWaypoints.length; i++) {
		const { lat, lng } = currentWaypoints[i].latLng;

		try {
			//Send a post request to store coordinates in DB
			const locationRes = await fetch(`${apiBase}/locations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionToken}`
				},
				body: JSON.stringify({ latitude: lat, longitude: lng })
			});
            
			//Exit if something goes wrong
			if (!locationRes.ok) {
				// If token is expired/invalid, silently stop saving
				alert(`Location ${i} failed: ${locationRes.status}`);
				return;
			}

			//Parse response to get the new location ID
			const locationData = await locationRes.json();
			//Add to list of route stops
			stops.push({
				stopNum: i + 1,
				locationId: locationData.locationId
			});
		} catch (err) {
			//failure logging
			alert(`Error creating location ${i}:`, err);
			return; // Silent fail
		}
	}

	// Save route with associated stops
	try {
		const routeRes = await fetch(`${apiBase}/routes`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${sessionToken}` //including token
			},
			body: JSON.stringify({ name: routeName, stops })
		});

		if (!routeRes.ok) {
			alert(`Route save failed: ${routeRes.status}`);
			return;
		}

		const routeData = await routeRes.json();
		alert(`Route saved with ID: ${routeData.routeId}`);

		// Update route history UI if the function is in scope
		if (typeof UpdateRouteHistory === 'function') {
      	await UpdateRouteHistory(); 
    	}
		//Uncheck the "Save Route" checkbox to clsoe popup
    	const saveToggle = document.getElementById('save-route-toggle'); 
    	if (saveToggle) saveToggle.checked = false; 
		//Clear the input field
    	const rn = document.getElementById('route-name'); 
    	if (rn) rn.value = ''; 
		

	} catch (err) {
		alert("Route creation error:", err);
	}
}	

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

// ========== REROUTE WHEN USER SUBMITS NEW VALUES =========
// this code waits for a submission of the form, then creates
// a new instance of customGraphHopper with the new height 
// limit and re-routes the map
// =========================================================
document.getElementById("form").addEventListener("submit", async function (e) {
	e.preventDefault(); 

	// Get the current waypoints
	let currentWaypoints = control.getWaypoints();

	//Get new values from the form inputs
	let heightInput = document.querySelector("input[name='heightIn']").value;
	let height = parseFloat(heightInput);
	let weightInput = document.querySelector("input[name='weightIn']").value;
	let weight = parseFloat(weightInput);
	let widthInput = document.querySelector("input[name='widthIn']").value;
	let width = parseFloat(widthInput);

	//verify form inputs
	if (isNaN(height)) {
		alert("Please enter a valid height in meters.");
		return;
	}
	else if (isNaN(weight)) {
	    alert("Please enter a valid weight in tons.");
	    return;
	}else if (isNaN(width)) {
	    alert("Please enter a valid width in meters.");
	    return;
	}

	// Remove old control from map
	map.removeControl(control);
	if (errorControl) {
		map.removeControl(errorControl);
	}

	// Create a new custom router with the height limit
	const newCustomRouter = new L.Routing.CustomGraphHopper('', {
		serviceUrl: 'http://localhost:8989/route',
		profile: 'truck1',
		heightLimit: height,
		weightLimit: weight,
		widthLimit: width 
	});

	// Recreate routing control with the updated router
	control = L.Routing.control({
		waypoints: [
			...currentWaypoints 
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

	await saveCurrentRoute(true);
});
