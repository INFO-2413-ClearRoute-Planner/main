//Map UI
var map = L.map('map').setView([51.134685, 71.411362], 15);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


//Marker Handling 
let startMarker = null;
let endMarker = null;

map.on('click', function(e){
    //Receive Coordinates on click
    var coord = e.latlng.toString().split(',');
    var lat = coord[0].split('(');
    var lng = coord[1].split(')');

    //Set up Marker
    if(startMarker == null)
    {
        startMarker = L.marker([lat[1], lng[0]]).addTo(map);
        document.getElementById("start").textContent = coord;
    }
    else if(endMarker == null) 
    {
        endMarker = L.marker([lat[1], lng[0]]).addTo(map);
        document.getElementById("end").textContent = coord;
    }
});

document.getElementById("clearDir").onclick = clearDirection

function clearDirection()
{
    if(startMarker) 
    {
        map.removeLayer(startMarker);
        startMarker = null;
        document.getElementById("start").textContent = "";
    }

    if(endMarker) 
    {
        map.removeLayer(endMarker);
        endMarker = null;
        document.getElementById("end").textContent = "";
    }
}