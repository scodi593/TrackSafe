import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  timestamp: Date;
  type: 'deviation' | 'info' | 'destinationReached' | 'wrongDirection' | 'crossedDestination' | 'warning';
}

export const AlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (message: string, type: 'deviation' | 'info' | 'destinationReached' | 'wrongDirection' | 'crossedDestination' | 'warning') => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      message,
      timestamp: new Date(),
      type,
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const handleAlert = (event: CustomEvent) => {
      addAlert(event.detail.message, event.detail.type);
    };

    window.addEventListener('tracksafe:alert' as any, handleAlert);
    return () => {
      window.removeEventListener('tracksafe:alert' as any, handleAlert);
    };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        <Bell className="w-6 h-6 mr-2" />
        Alerts
      </h2>
      {alerts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No alerts at the moment.</p>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li 
              key={alert.id} 
              className={`flex items-start p-4 rounded-md transition-colors duration-200 ${
                alert.type === 'deviation' || alert.type === 'warning'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200' // Yellow for warning
                  : alert.type === 'wrongDirection' || alert.type === 'crossedDestination'
                  ? 'bg-red-100 dark:bg-red-800 text-red-600'
                  : alert.type === 'destinationReached'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200'
              }`}
            >
              {alert.type === 'destinationReached' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 text-green-500 dark:text-green-400" />
              ) : alert.type === 'wrongDirection' || alert.type === 'crossedDestination' ? (
                <XCircle className="w-5 h-5 mr-2 flex-shrink-0 text-red-500 dark:text-red-400" />
              ) : (
                <AlertTriangle className={`w-5 h-5 mr-2 flex-shrink-0 ${
                  alert.type === 'deviation' || alert.type === 'warning' ? 'text-yellow-500 dark:text-yellow-400' : 'text-blue-500 dark:text-blue-400'
                }`} />
              )}
              <div className="flex-1">
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm opacity-75 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
