# Installation
## 1. GraphHopper

Purpose: Get GraphHopper installed and running with British Columbia map data. This is the routing engine 
### 1.1 GraphHopper dependencies (Java)

To install GraphHopper locally, you need a version of Java >= 17

 Download JDK 24:

    Visit the official oracle website: https://www.oracle.com/java/technologies/downloads

    Download the installer of the version corresponding to your system

    Once download is completed, run the installer and follow the instructions to complete the installation

### 1.2 Download the british-columbia-latest.osm.pbf map data

    Click this link to download the map data https://download.geofabrik.de/north-america/canada/british-columbia-latest.osm.pbf 

    Place the file next to your main folder so its address is ClearRoutePlanner\british-columbia-latest.osm.pbf

### 1.3 Download the GraphHopper jar file

    Click this link to download graphhopper-web-10.0.jar https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/10.0/graphhopper-web-10.0.jar 

    Place the file in ClearRoutePlanner\main\GraphHopper\data. This will be in the same folder as our config.yml file

### 1.4 Run GraphHopper

    To run GraphHopper, first open Windows PowerShell

    Navigate in PowerShell to the folder where your GraphHopper Jar file is using the following command (using the location of the ClearRoutePlanner folder on your computer)

        cd C:\Users\Jared\Documents\ClearRoutePlanner\main\GraphHopper\data

    With PowerShell in that folder, run the following command to start GraphHopper from our jar file, using the map data and our config.yml

         java -D"dw.graphhopper.datareader.file=../../../british-columbia-latest.osm.pbf" -jar graphhopper-web-10.0.jar server config.yml

    After a while you see a log message with 'Server - Started', then go to http://localhost:8989/ and you'll see a map of BC. You should be able to right click on the map to create a route. This confirms that our local GraphHopper service is working

        This UI is built into GraphHopper by default, but we built our own using the Leaflet Routing Machine library

## 2. Leaflet Routing Machine (LRM)

Purpose: Get the Leaflet Routing Machine library installed and configured. This is what displays our map on the webpage
### 2.1 Download LRM

    To download, go to this link and select the v3.2.12 .zip file https://github.com/perliedman/leaflet-routing-machine/releases 

    Extract the file and place leaflet-routing-machine-3.2.12 next to the data folder in ClearRoutePlanner\main\GraphHopper

### 2.2 Download LRM-GraphHopper

    This file is needed to connect LRM to GraphHopper, to download it, go to this link, right click and select save as, which should download the file as a .js https://www.liedman.net/lrm-graphhopper/dist/lrm-graphhopper-1.2.0.js 

    Once downloaded, this file needs to be placed in the folder ClearRoutePlanner\main\GraphHopper\leaflet-routing-machine-3.2.12

### 2.3 Modifying LRM

    In order to make LRM go to a local instance of GraphHopper rather than an online OSRM service, some code must be changed in the leaflet-routing-machine.js file. You can find this file at ClearRoutePlanner\main\GraphHopper\leaflet-routing-machine-3.2.12\dist

    The section of code that needs to be changed is line 17911 and 17912. Press ctrl+G in VS code, then type in the line number to jump to that line
    These lines should say

    serviceUrl: 'https://router.project-osrm.org/route/v1',

profile: 'driving',

replace them with these lines instead

serviceUrl: 'http://localhost:8989/route',

profile: 'truck1',

    LRM should now work, and if you are running GraphHopper, you can now open ClearRoutePlanner\main\index.html to check that it is working. The web app should be fully functional, just without the database functions such as logging in and saving routes


## 3. Setup Backend

Purpose:

Focuses on getting our Node.js/Express backend, connected to a MySQL database, and backend API running and verified.
### 3.1 Prerequisites

NOTE on dependencies:

    From the backend folder, you can simply run “npm i” to install ALL required Node dependencies. (Recommended)

    Alternatively, you can manually install dependencies by following the links for Node.js and MySQL.

Node.js and npm

    Check:  node -v

    Get Node.js (includes npm): https://nodejs.org/en/download 

Manual Install:

    Get Express: https://expressjs.com/ 

    Get MySQL2: https://www.npmjs.com/package/mysql2 

    Get jsonwebtoken: https://www.npmjs.com/package/jsonwebtoken 

    Get bcryptjs: https://www.npmjs.com/package/bcryptjs

    Get dotenv: https://www.npmjs.com/package/dotenv

    Get cors: https://www.npmjs.com/package/cors 

### 3.2 Configure Environment Variables

In ./main/backend, create a file named **.env** (same directory where index.js runs). copy and paste the following text:

DB_USER=clearroute_admin

DB_PASSWORD=Hosd8co348fhHOUfhowuef397679&)*&

DB_SERVER=clearoutedb.mysql.database.azure.com

DB_NAME=clearrouteplanner

JWT_SECRET=PgX1ggeD8HYCfwGCr0m8lWOEffTBIcOAapnyPZr09hvrkpwGdia5dRxq9HACN1OxGTaWXXHRhCNpoTpTObrtjZdRXYAFLTZ41Ll4DMuNjDoUHVjks6Fyjzemzv4oVLFDr1SBAJhzWtEGlAo55Qra4STqKGgraucwSr34V7BNmG9XX6OvFYz9nybwRTDC3yZCGEr6emVxYxV094K3rqZxt2IgjeScQwyMRTVFdfJHrrPl3qRqdNw44fj4ZgNR61LP

PORT=3000

### 3.3 Start the Backend Server

From ./main/backend, run:

node index.js

You should see something like “Server listening on port 3000”. Keep this terminal open.

### 3.4 Troubleshooting

A) Error: Access denied for user ''@'localhost' (using password: NO)

    Cause: Missing/incorrect DB credentials or .env not being read.

    Ensure .env exists and has DB_* vars set correctly.


B) ECONNREFUSED or ETIMEDOUT to MySQL

    Verify host/port in .env.


C) Can’t find module ‘dotenv’

    Run:  npm i dotenv



## 4. Final Steps

With GraphHopper and the database running, all you need to do to access the web app is open the index.html file located in main

To test constrained routing (Max Height/Weight), you must find routes that usually take you through restricted roads.

The default route, the one that shows up when the website is opened, is one such route, taking you through a height restricted area by default. We have prepared an account with a few saved routes for you to try. 

Login info:

Email: DemoRouting@gmail.com

Password: DemoPass1234!
