import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from .lstm_model import RouteDeviationLSTM

class EnhancedRouteAnalyzer:
    def __init__(self):
        self.lstm_model = RouteDeviationLSTM()
        self.route_data = pd.DataFrame()
        self.current_route_points = []
        self.stop_threshold = timedelta(minutes=5)
        
    def update_route_data(self, timestamp, current_position, expected_position):
        """Update route data with new position information"""
        new_data = {
            'timestamp': timestamp,
            'current_lat': current_position[0],
            'current_lon': current_position[1],
            'expected_lat': expected_position[0],
            'expected_lon': expected_position[1],
            'stopped': self._check_if_stopped(current_position)
        }
        
        self.route_data = pd.concat([
            self.route_data, 
            pd.DataFrame([new_data])
        ]).reset_index(drop=True)
        
        # Keep only recent data for analysis
        self.route_data = self.route_data.tail(1000)
        
    def _check_if_stopped(self, current_position):
        """Check if vehicle has been stopped for longer than threshold"""
        if len(self.current_route_points) < 2:
            self.current_route_points.append((current_position, datetime.now()))
            return False
            
        last_position, last_time = self.current_route_points[-1]
        time_diff = datetime.now() - last_time
        
        # Calculate distance between current and last position
        distance = np.sqrt(
            (current_position[0] - last_position[0])**2 +
            (current_position[1] - last_position[1])**2
        )
        
        # Update points list
        self.current_route_points.append((current_position, datetime.now()))
        if len(self.current_route_points) > 10:  # Keep last 10 points
            self.current_route_points.pop(0)
            
        # Check if stopped
        return distance < 0.0001 and time_diff > self.stop_threshold
        
    def analyze_current_route(self):
        """Analyze current route for deviations and patterns"""
        if len(self.route_data) < self.lstm_model.sequence_length:
            return None
            
        recent_data = self.route_data.tail(self.lstm_model.sequence_length)
        predictions = self.lstm_model.analyze_route_pattern(recent_data)
        
        return {
            'predictions': predictions,
            'deviation_detected': any(p['is_deviation'] for p in predictions),
            'confidence': np.mean([p['confidence'] for p in predictions])
        }
        
    def train_model(self, historical_data=None):
        """Train LSTM model with historical data"""
        if historical_data is not None:
            self.route_data = pd.concat([
                self.route_data,
                pd.DataFrame(historical_data)
            ]).reset_index(drop=True)
            
        if len(self.route_data) > self.lstm_model.sequence_length:
            self.lstm_model.train(self.route_data)
            return True
        return False