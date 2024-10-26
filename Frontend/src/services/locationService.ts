import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

interface RouteAnalysis {
  predictions: Array<{
    timestamp: string;
    is_deviation: boolean;
    confidence: number;
  }>;
  deviation_detected: boolean;
  confidence: number;
}

export async function updateLocation(
  latitude: number,
  longitude: number,
  plannedRoute: [number, number][],
  phoneNumber: string
) {
  try {
    // Get current timestamp
    const timestamp = new Date().toISOString();

    // Find expected position (closest point on planned route)
    const expectedPosition = findClosestRoutePoint(latitude, longitude, plannedRoute);

    // Prepare data for sending
    const locationData = {
      timestamp,
      current_position: [latitude, longitude],
      expected_position: expectedPosition,
      phone_number: phoneNumber
    };

    // Send data to backend with timeout and retry logic
    const response = await axios.post(`${BACKEND_URL}/location/update`, locationData, {
      timeout: 5000,
      retry: 3,
      retryDelay: 1000,
    }).catch(async (error) => {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        // Handle offline mode - store update locally
        const offlineData = {
          ...locationData,
          timestamp: new Date().toISOString(),
        };
        
        // Store in localStorage for later sync
        const storedUpdates = JSON.parse(localStorage.getItem('offlineLocationUpdates') || '[]');
        storedUpdates.push(offlineData);
        localStorage.setItem('offlineLocationUpdates', JSON.stringify(storedUpdates));

        // Return mock response for offline mode
        return {
          data: {
            analysis: {
              predictions: [],
              deviation_detected: false,
              confidence: 0
            }
          }
        };
      }
      throw error;
    });

    const analysis: RouteAnalysis = response.data.analysis;

    // If deviation detected with high confidence, send alert
    if (analysis.deviation_detected && analysis.confidence > 0.8) {
      await sendDeviationAlert(latitude, longitude, phoneNumber).catch(error => {
        console.warn('Failed to send deviation alert:', error);
        // Store alert for retry
        const storedAlerts = JSON.parse(localStorage.getItem('pendingAlerts') || '[]');
        storedAlerts.push({ latitude, longitude, phoneNumber, timestamp: new Date().toISOString() });
        localStorage.setItem('pendingAlerts', JSON.stringify(storedAlerts));
      });
      
      // Dispatch custom event for AlertPanel with serializable data
      const alertEvent = new CustomEvent('tracksafe:alert', {
        detail: JSON.parse(JSON.stringify({
          message: `Significant route deviation detected! Confidence: ${(analysis.confidence * 100).toFixed(1)}%`,
          type: 'deviation'
        }))
      });
      window.dispatchEvent(alertEvent);
    }

    return response.data;
  } catch (error) {
    // Log error but don't crash the application
    console.warn('Error updating location:', error);
    return null;
  }
}

async function sendDeviationAlert(latitude: number, longitude: number, phoneNumber: string) {
  try {
    const alertData = {
      latitude,
      longitude,
      phone_number: phoneNumber,
      alert_type: 'deviation',
      message: 'Vehicle has significantly deviated from planned route!'
    };

    await axios.post(`${BACKEND_URL}/alert`, alertData, {
      timeout: 5000
    });
  } catch (error) {
    console.warn('Error sending alert:', error);
    throw error; // Allow caller to handle the error
  }
}

function findClosestRoutePoint(lat: number, lng: number, route: [number, number][]): [number, number] {
  let minDistance = Infinity;
  let closestPoint: [number, number] = route[0];

  route.forEach(point => {
    const distance = calculateDistance(lat, lng, point[0], point[1]);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  });

  return closestPoint;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}