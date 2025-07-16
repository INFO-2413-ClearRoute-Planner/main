var map = L.map('map');

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var control = L.Routing.control(L.extend(window.lrmConfig, {
	waypoints: [
		L.latLng(49.33, -123.03),
		L.latLng(49.25, -122.97)
	],

	// router: L.Routing.graphHopper('65aa92ed-185c-4819-91ec-e4aa7f2f75d2'),

	router: L.Routing.graphHopper('', {
		serviceUrl: 'http://localhost:8989/route',
		urlParameters:{
			profile: 'truck1'
		}
	}),

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