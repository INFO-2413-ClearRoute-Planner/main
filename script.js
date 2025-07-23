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
});