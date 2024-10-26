import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { updateLocation } from '../services/locationService';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapContainerProps {
  route: { origin: string; destination: string } | null;
  phoneNumber: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

const MapContainer: React.FC<MapContainerProps> = ({ route, phoneNumber }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!route || !map) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: route.origin,
        destination: route.destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Center the map on the route
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs[0].steps.forEach((step) => {
            bounds.extend(step.start_location);
            bounds.extend(step.end_location);
          });
          map.fitBounds(bounds);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [route, map]);

  useEffect(() => {
    if (!directions?.routes[0]?.overview_path) return;

    const path = directions.routes[0].overview_path;
    let currentIndex = 0;

    const interval = setInterval(() => {
      const newPosition = {
        lat: path[currentIndex].lat(),
        lng: path[currentIndex].lng()
      };
      
      setCurrentPosition(newPosition);
      updateLocation(
        newPosition.lat,
        newPosition.lng,
        path.map(p => [p.lat(), p.lng()]),
        phoneNumber
      );

      currentIndex = (currentIndex + 1) % path.length;
    }, 5000);

    return () => clearInterval(interval);
  }, [directions, phoneNumber]);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#2563eb',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapContainer;