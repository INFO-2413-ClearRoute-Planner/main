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


function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}
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