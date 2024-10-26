import React, { useState } from 'react';
import { MapPin, Phone } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000/api';

interface RouteFormProps {
  setRoute: (route: { origin: string; destination: string }) => void;
  setPhoneNumber: (phoneNumber: string) => void;
}

export const RouteForm: React.FC<RouteFormProps> = ({ setRoute, setPhoneNumber }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/alert`, {
        phone_number: phone,
        origin: origin,
        destination: destination,
      }, {
        timeout: 5000
      });

      console.log('Response from backend:', response.data);  

      // Dispatch the alert event for the alert panel
      const alertEvent = new CustomEvent('tracksafe:alert', {
        detail: {
          message: response.data.message,  // Use the message from the backend
          type: response.data.success ? 'info' : 'deviation', // Adjust type based on success
        }
      });
      window.dispatchEvent(alertEvent);

      // Update the route state
      setRoute({ origin, destination });
      setPhoneNumber(phone);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Plan Your Route</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Starting Point
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              id="origin"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       dark:focus:ring-blue-400 dark:focus:border-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500
                       transition-colors duration-200"
              placeholder="Enter starting location"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Destination
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              id="destination"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       dark:focus:ring-blue-400 dark:focus:border-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500
                       transition-colors duration-200"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="tel"
              id="phone"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       dark:focus:ring-blue-400 dark:focus:border-blue-400
                       placeholder-gray-400 dark:placeholder-gray-500
                       transition-colors duration-200"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md transition-colors duration-200"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Submit Route'}
      </button>
    </form>
  );
};
