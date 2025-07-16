//Map UI
var map = L.map('map').setView([49.285996,-123.040412], 15);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.Routing.control({
waypoints: [
    L.latLng(49.316882,-123.042128),
    L.latLng(49.262722,-123.027022)
],
router: L.Routing.graphHopper(false, {
    serviceUrl: 'http://localhost:8989/route'  // Point to your GraphHopper server
}),
routeWhileDragging: true
}).addTo(map);