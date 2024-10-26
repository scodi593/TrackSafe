import requests
import polyline
import json
from datetime import datetime, timedelta

GOOGLE_MAPS_API_KEY = 'AIzaSyAsrjcal49hEHUNaE4gsEaHyW4YwoT-D7I'  # Replace with your actual API key

def get_route_coordinates_and_duration(origin, destination):
    # Request route data from Google Maps API
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&key={GOOGLE_MAPS_API_KEY}"
    response = requests.get(url)
    data = response.json()

    if response.status_code != 200 or data['status'] != 'OK':
        raise Exception("Error fetching directions: {}".format(data.get('error_message', 'Unknown error')))

    # Extract route coordinates and travel duration
    route = data["routes"][0]
    polyline_points = route["overview_polyline"]["points"]  # Get the polyline points
    route_coords = polyline.decode(polyline_points)  # Decode the polyline into coordinates
    duration = route['legs'][0]['duration']['value'] / 60  # Duration in minutes
    return route_coords, duration

def save_route_coordinates_with_time(origin, destination):
    try:
        # Get route coordinates and duration
        route_coords, total_duration = get_route_coordinates_and_duration(origin, destination)

        # Calculate average time per coordinate
        travel_time_per_coordinate = total_duration / len(route_coords)
        start_time = datetime.now()

        # Prepare data for saving
        route_data = []

        # Collect coordinates for the path with time
        for i, coord in enumerate(route_coords):
            # Calculate the time for each coordinate based on average travel time
            time_at_coordinate = start_time + timedelta(minutes=i * travel_time_per_coordinate)
            route_data.append({
                "latitude": coord[0],
                "longitude": coord[1],
                "time": time_at_coordinate.strftime('%Y-%m-%d %H:%M:%S')
            })

        # Use a fixed filename "UserPath.json"
        file_name = "UserPath.json"
        file_path = f'/Users/komalkrishna/Desktop/sb1-dwargr (2)/backend/User Path/{file_name}'  # Set the full path

        # Write the collected data to a JSON file (this will overwrite if the file exists)
        with open(file_path, 'w') as json_file:
            json.dump(route_data, json_file, indent=4)

        print(f'Route coordinates saved to {file_path}')

    except Exception as e:
        print("Error: {}".format(str(e)))

# Run the program in a loop
while True:
    # Take user input for origin and destination
    origin = input("Enter the starting location (or type 'exit' to quit): ")
    if origin.lower() == 'exit':
        break
    destination = input("Enter the destination location: ")

    # Call the function with user-provided input
    save_route_coordinates_with_time(origin, destination)
