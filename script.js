//Map UI
var map = L.map('map').setView([52.22461607040788, 20.99271139468625], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

L.Routing.control({
waypoints: [
    L.latLng(52.26322137056714, 21.015384884035132),  // Warsaw
    L.latLng(52.26044579171676, 21.016167448266224)  
],
router: new L.Routing.GraphHopper(false, {
    serviceUrl: 'http://localhost:8989/route',
    urlParameters: {
      profile: 'truck1',
      ch: 'false'
    },
    requestParameters: {
      custom_model: {
        distance_influence: 1,
        priority: [
          { if: "max_height < 5", multiply_by: "0" }
        ],
        speed: [
          { if: "true", limit_to: "80" }
        ]
      }
    }
  }),
routeWhileDragging: true
}).addTo(map);


// fetch('http://localhost:8989/route?profile=truck1&ch.disable=true', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     points: [
//       [52.263221, 21.015385],
//       [52.260446, 21.016167]
//     ],
//     custom_model: {
//       distance_influence: 1,
//       priority: [{ if: "true", multiply_by: "0" }],
//       speed: [{ if: "true", limit_to: "80" }]
//     }
//   })
// })
// .then(r => r.json())
// .then(console.log)
// .catch(console.error);
