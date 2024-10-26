from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv
import requests
import polyline
from geopy.distance import geodesic
from twilio.rest import Client

load_dotenv()

app = FastAPI()

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Maps API configuration
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
if not GOOGLE_MAPS_API_KEY:
    raise ValueError("Google Maps API key is not set in the environment variables.")

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
    raise ValueError("Twilio credentials are not set in the environment variables.")

# Initialize Twilio client
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# JSON file path from the environment variable
JSON_FILE_PATH = os.getenv('JSON_FILE_PATH')
if not JSON_FILE_PATH:
    raise ValueError("JSON file path is not set in the environment variables.")

class AlertRequest(BaseModel):
    phone_number: str
    origin: str
    destination: str

# Load coordinates from the JSON file
def load_coordinates_from_file(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    with open(file_path, 'r') as f:
        data = json.load(f)

    return [(entry["latitude"], entry["longitude"], entry["time"]) for entry in data]

# Calculate distance between two coordinates using geopy
def calculate_distance(coord1, coord2):
    return geodesic(coord1, coord2).meters

# Compare coordinates and return missing ones
def compare_coordinates(google_coords, file_coords):
    missing_coords = []
    for coord in google_coords:
        if coord not in [(fc[0], fc[1]) for fc in file_coords]:
            missing_coords.append(coord)
    return missing_coords

# Send SMS using Twilio
def send_sms(to: str, message: str):
    try:
        message = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        print(f"Message sent: {message.sid}")
    except Exception as e:
        print(f"Error sending message: {str(e)}")

@app.post("/api/alert")
async def send_alert(alert_request: AlertRequest):
    try:
        # Log the received data
        print(f"Received alert for phone: {alert_request.phone_number}, "
              f"origin: {alert_request.origin}, destination: {alert_request.destination}")
        
        # Request route data from Google Maps API
        url = f"https://maps.googleapis.com/maps/api/directions/json?origin={alert_request.origin}&destination={alert_request.destination}&key={GOOGLE_MAPS_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if response.status_code != 200 or data['status'] != 'OK':
            raise HTTPException(status_code=400, detail="Error fetching directions")

        # Extract route coordinates from the response
        route = data["routes"][0]
        polyline_points = route["overview_polyline"]["points"]
        route_coords = polyline.decode(polyline_points)

        # Load coordinates from the specified JSON file
        file_coords = load_coordinates_from_file(JSON_FILE_PATH)

        # Compare coordinates for missing ones
        missing_coords = compare_coordinates(route_coords, file_coords)

        # Calculate missing percentage
        missing_percentage = (len(missing_coords) / len(route_coords)) * 100

        # Destination coordinates (last coordinate from the Google route)
        destination_coord = route_coords[-1]

        # Print route coordinates and missing coordinates
        print("Route Coordinates:")
        for lat, lon in route_coords:
            print(f"Latitude: {lat}, Longitude: {lon}")
        
        print("Missing Coordinates:")
        for lat, lon in missing_coords:
            print(f"Missing Latitude: {lat}, Missing Longitude: {lon}")

        # Initialize the message variable
        message = ""

        if not missing_coords:
            message = "Destination Reached"
        elif missing_percentage <= 10:
            last_file_coord = file_coords[-1][:2]
            if destination_coord[:2] == last_file_coord or calculate_distance(destination_coord[:2], last_file_coord) < 500:
                message = "Destination Reached"
            else:
                message = "Wrong Direction"
        else:
            crossed_destination = any(calculate_distance((lat, lon), destination_coord) < 500 for lat, lon, _ in file_coords)
            if crossed_destination:
                message = "Crossed Destination"
            else:
                last_coord_file = file_coords[-1][:2]
                if any(calculate_distance(last_coord_file, coord) < 500 for coord in route_coords):
                    message = "Correct Direction but not reached destination"
                else:
                    message = "Wrong Direction"

        # Send the message to the phone number
        send_sms(alert_request.phone_number, message)

        return {
            "success": True,
            "message": message,
        }

    except Exception as e:
        print(f"Error in send_alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
