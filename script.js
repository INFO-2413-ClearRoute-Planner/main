// Map UI
var map = L.map('map').setView([49.28207317260126, -123.03236951998038], 14);

// Shows the Map
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

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