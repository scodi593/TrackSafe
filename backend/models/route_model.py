import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime
import json

class RouteAnalyzer:
    def __init__(self):
        self.model = DBSCAN(eps=0.01, min_samples=2)
        self.scaler = StandardScaler()
        self.routes_db_path = 'data/routes.json'
        self.model_path = 'data/route_model.pkl'
        
        # Create data directory if it doesn't exist
        os.makedirs('data', exist_ok=True)
        
        # Initialize or load routes database
        if os.path.exists(self.routes_db_path):
            with open(self.routes_db_path, 'r') as f:
                self.routes_db = json.load(f)
        else:
            self.routes_db = []
            self._save_routes_db()

    def _save_routes_db(self):
        with open(self.routes_db_path, 'w') as f:
            json.dump(self.routes_db, f)

    def save_route(self, origin, destination, route_points):
        """Save a new route to the database"""
        route_data = {
            'id': len(self.routes_db) + 1,
            'origin': origin,
            'destination': destination,
            'route_points': route_points,
            'timestamp': datetime.now().isoformat(),
            'frequency': 1
        }
        
        # Check if similar route exists
        similar_route = self._find_similar_route(route_points)
        
        if similar_route:
            # Update frequency of existing route
            similar_route['frequency'] += 1
            self._save_routes_db()
            return similar_route['id']
        else:
            # Add new route
            self.routes_db.append(route_data)
            self._save_routes_db()
            return route_data['id']

    def _find_similar_route(self, new_route_points, similarity_threshold=0.85):
        """Find similar existing routes using DBSCAN clustering"""
        if not self.routes_db:
            return None

        for route in self.routes_db:
            existing_points = np.array(route['route_points'])
            new_points = np.array(new_route_points)
            
            # Normalize points for comparison
            if len(existing_points) > 0 and len(new_points) > 0:
                existing_normalized = self.scaler.fit_transform(existing_points)
                new_normalized = self.scaler.transform(new_points)
                
                # Calculate similarity score
                similarity = self._calculate_route_similarity(existing_normalized, new_normalized)
                
                if similarity > similarity_threshold:
                    return route
        
        return None

    def _calculate_route_similarity(self, route1, route2):
        """Calculate similarity between two routes using Dynamic Time Warping"""
        from scipy.spatial.distance import cdist
        
        # Calculate distance matrix
        distances = cdist(route1, route2)
        
        # Simple DTW implementation
        n, m = len(route1), len(route2)
        dtw_matrix = np.zeros((n + 1, m + 1))
        dtw_matrix[1:, 0] = np.inf
        dtw_matrix[0, 1:] = np.inf
        
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                cost = distances[i-1, j-1]
                dtw_matrix[i, j] = cost + min(dtw_matrix[i-1, j],    # insertion
                                            dtw_matrix[i, j-1],    # deletion
                                            dtw_matrix[i-1, j-1])  # match
                
        # Convert DTW distance to similarity score (0 to 1)
        similarity = 1 / (1 + dtw_matrix[n, m])
        return similarity

    def get_popular_routes(self, limit=5):
        """Get most frequently used routes"""
        sorted_routes = sorted(self.routes_db, key=lambda x: x['frequency'], reverse=True)
        return sorted_routes[:limit]

    def get_route_suggestions(self, origin, destination):
        """Get route suggestions based on historical data"""
        matching_routes = []
        
        for route in self.routes_db:
            if (self._locations_match(route['origin'], origin) and 
                self._locations_match(route['destination'], destination)):
                matching_routes.append(route)
        
        return sorted(matching_routes, key=lambda x: x['frequency'], reverse=True)

    def _locations_match(self, loc1, loc2, threshold=0.01):
        """Compare two locations with a threshold"""
        try:
            lat1, lon1 = float(loc1['lat']), float(loc1['lng'])
            lat2, lon2 = float(loc2['lat']), float(loc2['lng'])
            
            return (abs(lat1 - lat2) < threshold and 
                   abs(lon1 - lon2) < threshold)
        except:
            return False