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

//Registration Front-end Validation

//Validate Full Name
document.getElementById("registerName").addEventListener("input", function() {
const name = this.value.trim();
const error = document.getElementById("nameError");

if (name === "" || !/^[A-Za-z\s]+$/.test(name)) {
    error.textContent = "Only letters and spaces allowed.";
} 
else {
    error.textContent = "";
}
});

//Validate Email
document.getElementById("registerEmail").addEventListener("input", function() {
const email = this.value.trim();
const error = document.getElementById("emailError");
const pattern = /\S+@\S+\.\S+/;

error.textContent = pattern.test(email) ? "" : "Invalid email format.";
});

//Validate Password
document.getElementById("registerPassword").addEventListener("input", function() {
const password = this.value;
const error = document.getElementById("passwordError");

// At least 1 upper case and 1 symbol and 8 characters long
const passwordPattern = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
if (!passwordPattern.test(password)) {
    error.textContent = "Password must be at least 8 characters long and include 1 symbol & 1 uppercase  letter. ";
}
else {
    error.textContent = "";
}
});

//Validate Confirm Password
document.getElementById("registerConfirm").addEventListener("input", function() {
const confirm = this.value;
const password = document.getElementById("registerPassword").value;
const error = document.getElementById("confirmPassError");

error.textContent = confirm === password ? "" : "Password do not match.";
});