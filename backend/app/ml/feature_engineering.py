"""
Feature Engineering for Crop Yield Prediction
Transforms raw climate data into ML-ready features
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class FeatureSet:
    """Container for engineered features"""
    features: np.ndarray
    feature_names: List[str]
    metadata: Dict


class FeatureEngineer:
    """
    Feature engineering pipeline for crop yield prediction
    Creates derived features from raw climate data
    """
    
    def __init__(self):
        self.feature_names = []
        self.scalers = {}
        self.fitted = False
    
    def fit_transform(self, df: pd.DataFrame) -> FeatureSet:
        """Fit the feature engineer and transform data"""
        features = []
        names = []
        
        # 1. Basic climate features (standardized)
        basic_features = ['temp_avg', 'temp_min', 'temp_max', 'precipitation', 
                         'humidity', 'solar_radiation', 'wind_speed']
        
        for col in basic_features:
            if col in df.columns:
                values = df[col].values
                mean, std = values.mean(), values.std()
                self.scalers[col] = (mean, std)
                normalized = (values - mean) / (std + 1e-8)
                features.append(normalized)
                names.append(col)
        
        # 2. Temperature-derived features
        if 'temp_max' in df.columns and 'temp_min' in df.columns:
            # Diurnal temperature range
            dtr = df['temp_max'] - df['temp_min']
            features.append(self._normalize(dtr.values, 'dtr'))
            names.append('diurnal_temp_range')
            
            # Temperature stress index
            if 'temp_avg' in df.columns:
                heat_stress = np.maximum(0, df['temp_avg'] - 30)
                cold_stress = np.maximum(0, 5 - df['temp_avg'])
                features.append(heat_stress.values)
                features.append(cold_stress.values)
                names.extend(['heat_stress_index', 'cold_stress_index'])
        
        # 3. Water-related features
        if 'precipitation' in df.columns and 'humidity' in df.columns:
            # Water availability index
            water_index = df['precipitation'] * 0.7 + df['humidity'] * 0.3
            features.append(self._normalize(water_index.values, 'water_index'))
            names.append('water_availability_index')
            
            # Drought stress indicator
            drought_stress = np.maximum(0, 50 - df['precipitation'])
            features.append(drought_stress.values / 50)
            names.append('drought_stress')
        
        # 4. Growing Degree Days features
        if 'temp_avg' in df.columns:
            # GDD with base 10°C
            gdd_10 = np.maximum(0, df['temp_avg'] - 10)
            features.append(self._normalize(gdd_10.values, 'gdd_10'))
            names.append('gdd_base_10')
            
            # GDD with base 5°C (for cold-hardy crops)
            gdd_5 = np.maximum(0, df['temp_avg'] - 5)
            features.append(self._normalize(gdd_5.values, 'gdd_5'))
            names.append('gdd_base_5')
        
        # 5. Solar features
        if 'solar_radiation' in df.columns:
            # Photosynthetically active radiation (approximation)
            par = df['solar_radiation'] * 0.48
            features.append(self._normalize(par.values, 'par'))
            names.append('photosynthetic_radiation')
        
        # 6. Interaction features
        if 'temp_avg' in df.columns and 'precipitation' in df.columns:
            # Temperature-precipitation interaction
            tp_interaction = df['temp_avg'] * np.log1p(df['precipitation'])
            features.append(self._normalize(tp_interaction.values, 'tp_int'))
            names.append('temp_precip_interaction')
        
        if 'humidity' in df.columns and 'temp_avg' in df.columns:
            # Vapor pressure deficit (simplified)
            vpd = (100 - df['humidity']) * 0.01 * np.exp(17.27 * df['temp_avg'] / (df['temp_avg'] + 237.3))
            features.append(self._normalize(vpd.values, 'vpd'))
            names.append('vapor_pressure_deficit')
        
        # 7. Crop encoding (one-hot or label)
        if 'crop_id' in df.columns:
            features.append(df['crop_id'].values)
            names.append('crop_id')
        
        # 8. Location features
        if 'latitude' in df.columns:
            # Latitude-based features
            lat_rad = np.radians(df['latitude'])
            features.append(np.sin(lat_rad))
            features.append(np.cos(lat_rad))
            names.extend(['lat_sin', 'lat_cos'])
        
        # 9. Seasonal features
        if 'month' in df.columns:
            month_rad = 2 * np.pi * df['month'] / 12
            features.append(np.sin(month_rad))
            features.append(np.cos(month_rad))
            names.extend(['month_sin', 'month_cos'])
        
        # 10. Soil and management features
        if 'soil_quality' in df.columns:
            features.append(df['soil_quality'].values)
            names.append('soil_quality')
        
        if 'growing_days' in df.columns:
            features.append(self._normalize(df['growing_days'].values, 'grow_days'))
            names.append('growing_days_norm')
        
        # Stack all features
        feature_matrix = np.column_stack(features)
        
        self.feature_names = names
        self.fitted = True
        
        return FeatureSet(
            features=feature_matrix,
            feature_names=names,
            metadata={
                'n_samples': len(df),
                'n_features': len(names),
                'scalers': self.scalers
            }
        )
    
    def transform(self, df: pd.DataFrame) -> FeatureSet:
        """Transform new data using fitted parameters"""
        if not self.fitted:
            raise ValueError("FeatureEngineer not fitted. Call fit_transform first.")
        
        return self.fit_transform(df)  # Use same logic for now
    
    def _normalize(self, values: np.ndarray, name: str) -> np.ndarray:
        """Normalize values and store parameters"""
        mean, std = values.mean(), values.std()
        self.scalers[name] = (mean, std)
        return (values - mean) / (std + 1e-8)
    
    def get_feature_importance_names(self) -> List[str]:
        """Get human-readable feature names for importance plot"""
        display_names = {
            'temp_avg': 'Average Temperature',
            'temp_min': 'Minimum Temperature',
            'temp_max': 'Maximum Temperature',
            'precipitation': 'Precipitation',
            'humidity': 'Humidity',
            'solar_radiation': 'Solar Radiation',
            'wind_speed': 'Wind Speed',
            'diurnal_temp_range': 'Day-Night Temp Range',
            'heat_stress_index': 'Heat Stress',
            'cold_stress_index': 'Cold Stress',
            'water_availability_index': 'Water Availability',
            'drought_stress': 'Drought Stress',
            'gdd_base_10': 'Growing Degree Days',
            'gdd_base_5': 'GDD (Cold Hardy)',
            'photosynthetic_radiation': 'Light for Photosynthesis',
            'temp_precip_interaction': 'Temp × Precipitation',
            'vapor_pressure_deficit': 'Evaporation Pressure',
            'crop_id': 'Crop Type',
            'lat_sin': 'Latitude (Sin)',
            'lat_cos': 'Latitude (Cos)',
            'month_sin': 'Season (Sin)',
            'month_cos': 'Season (Cos)',
            'soil_quality': 'Soil Quality',
            'growing_days_norm': 'Growing Season Length',
        }
        return [display_names.get(name, name) for name in self.feature_names]


def create_prediction_features(
    crop: str,
    temp_avg: float,
    temp_min: float,
    temp_max: float,
    precipitation: float,
    humidity: float,
    solar_radiation: float,
    latitude: float,
    longitude: float,
    month: int,
    growing_days: int = 100,
    soil_quality: float = 0.7,
    wind_speed: float = 5.0
) -> Dict:
    """
    Create a feature dictionary for a single prediction
    """
    from .data_generator import CROP_PARAMETERS
    
    crops = list(CROP_PARAMETERS.keys())
    crop_id = crops.index(crop) if crop in crops else 0
    
    return {
        'crop_id': crop_id,
        'temp_avg': temp_avg,
        'temp_min': temp_min,
        'temp_max': temp_max,
        'precipitation': precipitation,
        'humidity': humidity,
        'solar_radiation': solar_radiation,
        'wind_speed': wind_speed,
        'latitude': latitude,
        'longitude': longitude,
        'month': month,
        'soil_quality': soil_quality,
        'growing_days': growing_days,
    }
