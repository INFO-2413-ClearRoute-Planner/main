//Map UI
var map = L.map('map').setView([51.134685, 71.411362], 15);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//Marker Handling 
let currentMarker = null;

map.on('click', function(e){
    if(currentMarker) {map.removeLayer(currentMarker);}

    var coord = e.latlng.toString().split(',');
    var lat = coord[0].split('(');
    var lng = coord[1].split(')');

    console.log("You clicked the map at latitude: " + lat[1] + " and longitude:" + lng[0]);
    currentMarker = L.marker([lat[1], lng[0]]).addTo(map);
});
