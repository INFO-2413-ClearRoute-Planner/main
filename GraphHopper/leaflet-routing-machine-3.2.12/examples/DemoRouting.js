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
                        multiply_by: "0",
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
                instructions: [], // skipping turn-by-turn instructions for now
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
    profile: 'truck1'
});

let control = L.Routing.control(L.extend(window.lrmConfig, {
	waypoints: [
		L.latLng(49.33, -123.03),
		L.latLng(49.25, -122.97)
	],

	router: L.Routing.graphHopper('', {
		serviceUrl: 'http://localhost:8989/route',
		urlParameters:{
			profile: 'truck1'
		}
	}),

    router: customRouter,
	// geocoder: L.Control.Geocoder.nominatim(),
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

