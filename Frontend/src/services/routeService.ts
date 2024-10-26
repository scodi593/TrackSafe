import { DirectionsService } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAsrjcal49hEHUNaE4gsEaHyW4YwoT-D7I';

export async function fetchRoute(start: { lat: number, lon: number }, end: { lat: number, lon: number }) {
  try {
    const directionsService = new google.maps.DirectionsService();
    
    const result = await directionsService.route({
      origin: { lat: start.lat, lng: start.lon },
      destination: { lat: end.lat, lng: end.lon },
      travelMode: google.maps.TravelMode.DRIVING,
    });

    if (result.status === 'OK' && result.routes[0].overview_path) {
      return result.routes[0].overview_path.map(point => ({
        lat: point.lat(),
        lng: point.lng()
      }));
    }
    throw new Error('Route not found');
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
}