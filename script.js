//Map UI
var map = L.map('map').setView([51.1605, 71.4704], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.Routing.control({
waypoints: [
    L.latLng(51.1605, 71.4704),  // Astana
    L.latLng(49.8047, 73.1094)   // Karaganda
],
router: L.Routing.graphHopper(false, {
    serviceUrl: 'http://localhost:8989/route',
    urlParameters: {
      profile: 'truck1',
      ch: 'false'
    },
    requestParameters: {
      custom_model: {
        distance_influence: 1,
        priority: [
          { if: "hgv == NO", multiply_by: "0" },
          { if: "max_height < 4.2", multiply_by: "0" }
        ],
        speed: [
          { if: "true", limit_to: "95" }
        ]
      }
    }
  }),
routeWhileDragging: true
}).addTo(map);