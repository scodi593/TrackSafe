# TrackSafe - Path Deviation Detection System

*TrackSafe* is a Python-based path monitoring system designed to simulate and track the movement of a person or object along a predefined path. The system compares real-time GPS coordinates (latitude and longitude) against a simulated dataset to detect any deviations from the expected path. When deviations are detected, an alert is triggered to notify about the anomaly. The frontend visualizes the person's real-time location and alerts in an interactive dashboard using *TypeScript* and *CSS*.

## Features

- *Random Data Generation*: Generates simulated datasets for location points (latitude, longitude) to create a predefined path.
- *Path Monitoring*: Continuously monitors the current GPS location of a person/object.
- *Deviation Detection*: Compares real-time coordinates with the simulated path to detect any significant deviations.
- *Alert System*: Sends an alert when the person or object deviates from the predefined path.
- *Frontend Dashboard: A visual interface displaying real-time location data and alerts, built with **TypeScript* and *CSS*.

## Project Structure

- *main.py*: The main execution file that generates random dataset simulating the expected path. It initializes and triggers the path monitoring and deviation detection process.
- *path_simulator.py*: Simulates the real-time location of a person or object by generating random longitude and latitude values.
- */frontend/*: Contains all the frontend files, including TypeScript and CSS, to display the real-time data and alert notifications.
  - *index.html*: The main HTML file for the dashboard.
  - *styles.css*: Custom CSS for styling the frontend.
  - *app.ts*: TypeScript code that handles fetching real-time data, comparing it with expected values, and displaying alerts on the dashboard.
- *Deviation Detection Algorithm*: Compares real-time location data with the expected path and identifies if the person/object deviates from the expected coordinates.

## Tech Stack

### Backend
- *Python*: Core programming language used for generating path and detecting deviations.
- *NumPy/Pandas*: (Optional) Used for data generation and processing.
- *Geopy*: Used for handling geographic coordinates if necessary.
  
### Frontend
- *TypeScript*: Handles dynamic behavior and data fetching on the frontend.
- *CSS*: Custom styles for the dashboard to display real-time data and alerts.
- *HTML*: Provides the structure of the frontend interface.
  
### Deviation Detection Algorithm
1. *Random Path Generation*: 
   - The main.py script creates a simulated dataset of GPS coordinates (longitude and latitude) representing the expected path.
   
2. *Location Monitoring*:
   - The path_simulator.py script generates real-time GPS coordinates to simulate the current location of a person or object.
   
3. *Comparison*:
   - The deviation detection algorithm compares the real-time coordinates with the expected coordinates.
   - If the current position differs from the predefined path by a significant threshold, an alert is triggered.

### Alert System
- The system sends out an alert whenever the person or object deviates from the expected path.
- Alerts are displayed both in the backend (console) and the frontend dashboard, showing visual notifications for deviations.

## Installation and Setup

### Backend Setup
1. *Clone the Repository*:
   bash
   git clone https://github.com/scodi593/TrackSafe.git
   cd TrackSafe
   

2. *Install Dependencies*:
   Install required Python libraries:
   bash
   pip install -r requirements.txt
   

3. *Run the Program*:
   Run the main program to simulate the path and track location deviations:
   bash
   python main.py
   

### Frontend Setup
1. *Install Dependencies* (if using TypeScript):
   Navigate to the frontend folder and install the required dependencies:
   bash
   cd frontend
   npm install
   

2. *Compile TypeScript*:
   If you modify the TypeScript code, compile it to JavaScript:
   bash
   tsc app.ts
   

3. *Serve Frontend*:
   Open the index.html file in a browser or serve it using a local web server to view the real-time data and alerts.

## Usage

1. *Simulating Path*:
   - main.py generates a random dataset representing a predefined path.
   
2. *Simulating Real-Time Location*:
   - path_simulator.py generates random GPS coordinates to simulate the real-time movement of a person or object.

3. *Frontend Dashboard*:
   - Open frontend/index.html in a browser to view the current location and any deviations from the expected path.

4. *Deviation Detection*:
   - The backend compares the real-time coordinates to the predefined path, detecting and alerting for any deviations.
   - Alerts will be shown both on the console and the frontend dashboard.
