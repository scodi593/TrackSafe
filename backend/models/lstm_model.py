import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import pandas as pd
import os
from datetime import datetime

class RouteDeviationLSTM:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.sequence_length = 10
        self.model_path = 'data/lstm_model.h5'
        self.data_path = 'models/data.csv'
        
        if os.path.exists(self.model_path):
            self.model = load_model(self.model_path)
            
        # Load or create initial dataset
        if os.path.exists(self.data_path):
            self.data = pd.read_csv(self.data_path)
        else:
            self.data = pd.DataFrame(columns=[
                'timestamp', 'current_latitude', 'current_longitude',
                'expected_latitude', 'expected_longitude', 
                'time_taken_at_location', 'deviation', 'stopped'
            ])

    def prepare_data(self, data):
        """Prepare data for LSTM model"""
        features = [
            'current_latitude', 'current_longitude',
            'expected_latitude', 'expected_longitude',
            'time_taken_at_location', 'deviation', 'stopped'
        ]
        
        # Convert timestamp to seconds of day
        data['time_seconds'] = pd.to_datetime(data['timestamp']).dt.hour * 3600 + \
                              pd.to_datetime(data['timestamp']).dt.minute * 60 + \
                              pd.to_datetime(data['timestamp']).dt.second
        
        # Convert boolean stopped to int
        data['stopped'] = data['stopped'].astype(int)
        
        # Normalize features
        normalized_data = self.scaler.fit_transform(data[features + ['time_seconds']])
        
        # Create sequences
        X, y = [], []
        for i in range(len(normalized_data) - self.sequence_length):
            X.append(normalized_data[i:(i + self.sequence_length)])
            y.append(normalized_data[i + self.sequence_length, 6])  # deviation as target
            
        return np.array(X), np.array(y)

    def build_model(self, input_shape):
        """Build LSTM model architecture"""
        self.model = Sequential([
            LSTM(64, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        self.model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )

    def add_route_data(self, current_pos, expected_pos, time_taken, stopped):
        """Add new route data point"""
        new_data = pd.DataFrame([{
            'timestamp': datetime.now().isoformat(),
            'current_latitude': current_pos[0],
            'current_longitude': current_pos[1],
            'expected_latitude': expected_pos[0],
            'expected_longitude': expected_pos[1],
            'time_taken_at_location': time_taken,
            'deviation': self._calculate_deviation(current_pos, expected_pos),
            'stopped': stopped
        }])
        
        self.data = pd.concat([self.data, new_data], ignore_index=True)
        self.data.to_csv(self.data_path, index=False)

    def _calculate_deviation(self, current_pos, expected_pos):
        """Calculate deviation distance between current and expected position"""
        return np.sqrt(
            (current_pos[0] - expected_pos[0])**2 + 
            (current_pos[1] - expected_pos[1])**2
        )

    def train(self, epochs=50, batch_size=32):
        """Train the LSTM model"""
        if len(self.data) < self.sequence_length:
            return None
            
        X, y = self.prepare_data(self.data)
        
        if self.model is None:
            self.build_model(input_shape=(X.shape[1], X.shape[2]))
            
        history = self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.2,
            verbose=1
        )
        
        self.model.save(self.model_path)
        return history

    def predict_deviation(self, sequence):
        """Predict deviation for a sequence of route points"""
        if self.model is None:
            raise ValueError("Model not trained yet")
            
        normalized_sequence = self.scaler.transform(sequence)
        sequence_reshaped = normalized_sequence.reshape(1, self.sequence_length, -1)
        
        prediction = self.model.predict(sequence_reshaped)[0][0]
        return {
            'is_deviation': bool(prediction > 0.5),
            'confidence': float(prediction)
        }

    def analyze_route_pattern(self, recent_data):
        """Analyze recent route data for patterns and deviations"""
        if len(recent_data) < self.sequence_length:
            return []
            
        predictions = []
        for i in range(len(recent_data) - self.sequence_length):
            sequence = recent_data.iloc[i:i + self.sequence_length]
            prediction = self.predict_deviation(sequence)
            predictions.append({
                'timestamp': recent_data.iloc[i + self.sequence_length]['timestamp'],
                'is_deviation': prediction['is_deviation'],
                'confidence': prediction['confidence']
            })
            
        return predictions