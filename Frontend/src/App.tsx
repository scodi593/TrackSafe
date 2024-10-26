import React, { useState, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import { RouteForm } from './components/RouteForm';
import { AlertPanel } from './components/AlertPanel';
import { Navigation, Moon, Sun } from 'lucide-react';

function App() {
  const [route, setRoute] = useState<{ origin: string; destination: string } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Uncomment this if you want to simulate alerts for testing
  // const simulateAlerts = () => {
  //   // Simulate a correct direction but not reached destination
  //   window.dispatchEvent(new CustomEvent('tracksafe:alert', { detail: { message: "Correct direction but not reached destination.", type: "warning" } }));
    
  //   // Simulate a wrong direction
  //   window.dispatchEvent(new CustomEvent('tracksafe:alert', { detail: { message: "Wrong direction!", type: "wrongDirection" } }));

  //   // Simulate crossed destination
  //   window.dispatchEvent(new CustomEvent('tracksafe:alert', { detail: { message: "Crossed destination.", type: "crossedDestination" } }));

  //   // Simulate destination reached
  //   window.dispatchEvent(new CustomEvent('tracksafe:alert', { detail: { message: "Destination reached!", type: "destinationReached" } }));
  // };

  // Uncomment the following useEffect if you want to simulate alerts on load
  // useEffect(() => {
  //   // For testing purposes, simulate alerts on load
  //   simulateAlerts();
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">TrackSafe</h1>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-6 h-6" />
              ) : (
                <Moon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 space-y-6">
          <RouteForm setRoute={setRoute} setPhoneNumber={setPhoneNumber} />
          <AlertPanel />
        </div>
        <div className="md:w-2/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <MapContainer route={route} phoneNumber={phoneNumber} />
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} TrackSafe. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
