"""
Data Generator for Crop Yield Prediction
Generates realistic training data based on NASA climate patterns and agricultural research
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import random

# Crop-specific parameters based on FAO and agricultural research
CROP_PARAMETERS = {
    "wheat": {
        "optimal_temp": (15, 20),
        "temp_range": (3, 35),
        "water_need": (450, 650),  # mm per season
        "growing_days": (100, 130),
        "base_yield": 3500,  # kg/hectare
        "yield_std": 800,
        "temp_sensitivity": 0.08,
        "water_sensitivity": 0.12,
        "frost_tolerance": -5,
        "heat_tolerance": 32,
    },
    "corn": {
        "optimal_temp": (20, 30),
        "temp_range": (10, 40),
        "water_need": (500, 800),
        "growing_days": (90, 120),
        "base_yield": 9000,
        "yield_std": 2000,
        "temp_sensitivity": 0.10,
        "water_sensitivity": 0.15,
        "frost_tolerance": 0,
        "heat_tolerance": 38,
    },
    "rice": {
        "optimal_temp": (25, 35),
        "temp_range": (15, 40),
        "water_need": (1200, 2000),
        "growing_days": (110, 150),
        "base_yield": 5500,
        "yield_std": 1200,
        "temp_sensitivity": 0.06,
        "water_sensitivity": 0.20,
        "frost_tolerance": 10,
        "heat_tolerance": 40,
    },
    "soybean": {
        "optimal_temp": (20, 30),
        "temp_range": (10, 40),
        "water_need": (450, 700),
        "growing_days": (80, 120),
        "base_yield": 2800,
        "yield_std": 600,
        "temp_sensitivity": 0.07,
        "water_sensitivity": 0.10,
        "frost_tolerance": 2,
        "heat_tolerance": 35,
    },
    "potato": {
        "optimal_temp": (15, 20),
        "temp_range": (7, 30),
        "water_need": (500, 700),
        "growing_days": (90, 120),
        "base_yield": 35000,
        "yield_std": 8000,
        "temp_sensitivity": 0.09,
        "water_sensitivity": 0.11,
        "frost_tolerance": -2,
        "heat_tolerance": 28,
    },
    "cotton": {
        "optimal_temp": (25, 35),
        "temp_range": (15, 45),
        "water_need": (700, 1300),
        "growing_days": (150, 180),
        "base_yield": 1800,
        "yield_std": 400,
        "temp_sensitivity": 0.05,
        "water_sensitivity": 0.18,
        "frost_tolerance": 5,
        "heat_tolerance": 42,
    },
    "sugarcane": {
        "optimal_temp": (25, 35),
        "temp_range": (15, 40),
        "water_need": (1500, 2500),
        "growing_days": (270, 365),
        "base_yield": 70000,
        "yield_std": 15000,
        "temp_sensitivity": 0.04,
        "water_sensitivity": 0.22,
        "frost_tolerance": 5,
        "heat_tolerance": 40,
    },
}

# Regional climate patterns based on NASA POWER data
CLIMATE_ZONES = {
    "tropical": {
        "temp_mean": 27,
        "temp_std": 3,
        "precip_mean": 150,
        "precip_std": 80,
        "humidity_mean": 75,
        "solar_mean": 22,
    },
    "subtropical": {
        "temp_mean": 22,
        "temp_std": 6,
        "precip_mean": 100,
        "precip_std": 60,
        "humidity_mean": 65,
        "solar_mean": 20,
    },
    "temperate": {
        "temp_mean": 15,
        "temp_std": 10,
        "precip_mean": 70,
        "precip_std": 40,
        "humidity_mean": 55,
        "solar_mean": 16,
    },
    "continental": {
        "temp_mean": 10,
        "temp_std": 15,
        "precip_mean": 50,
        "precip_std": 30,
        "humidity_mean": 50,
        "solar_mean": 14,
    },
    "arid": {
        "temp_mean": 28,
        "temp_std": 8,
        "precip_mean": 20,
        "precip_std": 15,
        "humidity_mean": 30,
        "solar_mean": 25,
    },
}


class CropYieldDataset:
    """Dataset class for crop yield data"""
    
    def __init__(self, data: pd.DataFrame):
        self.data = data
        self.features = None
        self.targets = None
        self._prepare_data()
    
    def _prepare_data(self):
        """Prepare features and targets"""
        feature_cols = [col for col in self.data.columns if col not in ['yield', 'crop', 'year']]
        self.features = self.data[feature_cols].values
        self.targets = self.data['yield'].values
        self.feature_names = feature_cols
    
    def get_train_test_split(self, test_size: float = 0.2, random_state: int = 42):
        """Split data into train and test sets"""
        from sklearn.model_selection import train_test_split
        return train_test_split(
            self.features, self.targets, 
            test_size=test_size, 
            random_state=random_state
        )
    
    def get_cross_validation_folds(self, n_splits: int = 5):
        """Get cross-validation fold indices"""
        from sklearn.model_selection import KFold
        kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
        return list(kf.split(self.features))


def calculate_yield(
    crop: str,
    temp_avg: float,
    temp_min: float,
    temp_max: float,
    precipitation: float,
    humidity: float,
    solar_radiation: float,
    growing_days: int,
    soil_quality: float = 0.7,
    random_factor: bool = True
) -> float:
    """
    Calculate expected crop yield based on environmental factors
    Uses agricultural research-based formulas
    """
    params = CROP_PARAMETERS.get(crop, CROP_PARAMETERS["wheat"])
    base_yield = params["base_yield"]
    
    # Temperature factor (Gaussian response)
    opt_temp_low, opt_temp_high = params["optimal_temp"]
    opt_temp = (opt_temp_low + opt_temp_high) / 2
    temp_factor = np.exp(-((temp_avg - opt_temp) ** 2) / (2 * 10 ** 2))
    
    # Temperature stress penalties
    if temp_min < params["frost_tolerance"]:
        frost_stress = (params["frost_tolerance"] - temp_min) * 0.05
        temp_factor *= max(0.2, 1 - frost_stress)
    
    if temp_max > params["heat_tolerance"]:
        heat_stress = (temp_max - params["heat_tolerance"]) * 0.04
        temp_factor *= max(0.3, 1 - heat_stress)
    
    # Water factor (diminishing returns curve)
    water_need_low, water_need_high = params["water_need"]
    optimal_water = (water_need_low + water_need_high) / 2
    water_ratio = precipitation / optimal_water
    
    if water_ratio < 0.5:
        water_factor = water_ratio * 1.5  # Severe drought
    elif water_ratio < 1:
        water_factor = 0.75 + (water_ratio - 0.5) * 0.5  # Mild stress
    elif water_ratio < 1.5:
        water_factor = 1.0  # Optimal
    else:
        water_factor = max(0.5, 1.2 - (water_ratio - 1.5) * 0.3)  # Excess water
    
    # Solar radiation factor
    solar_factor = min(1.2, max(0.6, solar_radiation / 18))
    
    # Humidity factor (optimal around 60%)
    humidity_deviation = abs(humidity - 60) / 40
    humidity_factor = max(0.7, 1 - humidity_deviation * 0.3)
    
    # Growing season length factor
    opt_days_low, opt_days_high = params["growing_days"]
    opt_days = (opt_days_low + opt_days_high) / 2
    days_factor = min(1.1, max(0.5, growing_days / opt_days))
    
    # Calculate final yield
    yield_value = (
        base_yield 
        * temp_factor 
        * water_factor 
        * solar_factor 
        * humidity_factor 
        * days_factor 
        * soil_quality
    )
    
    # Add random variation (weather variability, pests, etc.)
    if random_factor:
        noise = np.random.normal(0, params["yield_std"] * 0.3)
        yield_value += noise
    
    return max(0, yield_value)


def generate_training_data(
    n_samples: int = 5000,
    crops: Optional[List[str]] = None,
    years: Tuple[int, int] = (2010, 2025),
    include_anomalies: bool = True
) -> pd.DataFrame:
    """
    Generate synthetic training data for crop yield prediction
    Based on realistic climate patterns and agricultural responses
    """
    if crops is None:
        crops = list(CROP_PARAMETERS.keys())
    
    data = []
    
    for _ in range(n_samples):
        # Random crop selection
        crop = random.choice(crops)
        params = CROP_PARAMETERS[crop]
        
        # Random climate zone
        zone = random.choice(list(CLIMATE_ZONES.keys()))
        climate = CLIMATE_ZONES[zone]
        
        # Random year
        year = random.randint(years[0], years[1])
        
        # Generate climate variables with seasonal variation
        month = random.randint(1, 12)
        seasonal_factor = np.sin((month - 3) * np.pi / 6)  # Peak in summer
        
        # Temperature (with year-over-year climate trend)
        temp_trend = (year - 2000) * 0.02  # Climate change effect
        temp_avg = climate["temp_mean"] + seasonal_factor * climate["temp_std"] + temp_trend
        temp_avg += np.random.normal(0, 3)
        temp_min = temp_avg - np.random.uniform(5, 15)
        temp_max = temp_avg + np.random.uniform(5, 15)
        temp_variance = (temp_max - temp_min) / 4
        
        # Precipitation
        precip_seasonal = 1 + 0.3 * np.sin((month - 6) * np.pi / 6)
        precipitation = climate["precip_mean"] * precip_seasonal + np.random.normal(0, climate["precip_std"])
        precipitation = max(0, precipitation)
        
        # Humidity (correlated with precipitation)
        humidity = climate["humidity_mean"] + 0.1 * precipitation + np.random.normal(0, 10)
        humidity = np.clip(humidity, 10, 100)
        
        # Solar radiation (inversely correlated with precipitation)
        solar_radiation = climate["solar_mean"] - 0.02 * precipitation + np.random.normal(0, 3)
        solar_radiation = np.clip(solar_radiation, 5, 30)
        
        # Wind speed
        wind_speed = np.random.gamma(2, 3)  # Gamma distribution for wind
        
        # Growing degree days (simplified)
        gdd = max(0, (temp_avg - 10) * 30)  # Monthly GDD
        
        # Soil quality (random but realistic)
        soil_quality = np.random.beta(3, 2)  # Skewed towards good soil
        
        # Growing days
        growing_days = random.randint(params["growing_days"][0], params["growing_days"][1])
        
        # Add anomaly years (drought, flood, extreme heat)
        if include_anomalies and random.random() < 0.1:
            anomaly_type = random.choice(["drought", "flood", "heat", "frost"])
            if anomaly_type == "drought":
                precipitation *= 0.3
                humidity *= 0.7
            elif anomaly_type == "flood":
                precipitation *= 3
                humidity *= 1.2
            elif anomaly_type == "heat":
                temp_avg += 8
                temp_max += 12
            elif anomaly_type == "frost":
                temp_min -= 15
        
        # Calculate yield
        yield_value = calculate_yield(
            crop=crop,
            temp_avg=temp_avg,
            temp_min=temp_min,
            temp_max=temp_max,
            precipitation=precipitation * growing_days / 30,  # Total season precipitation
            humidity=humidity,
            solar_radiation=solar_radiation,
            growing_days=growing_days,
            soil_quality=soil_quality
        )
        
        # Encode crop as numeric
        crop_encoded = list(CROP_PARAMETERS.keys()).index(crop)
        
        data.append({
            "crop_id": crop_encoded,
            "crop": crop,
            "year": year,
            "month": month,
            "latitude": random.uniform(-60, 60),
            "longitude": random.uniform(-180, 180),
            "temp_avg": round(temp_avg, 2),
            "temp_min": round(temp_min, 2),
            "temp_max": round(temp_max, 2),
            "temp_variance": round(temp_variance, 2),
            "precipitation": round(precipitation, 2),
            "humidity": round(humidity, 2),
            "solar_radiation": round(solar_radiation, 2),
            "wind_speed": round(wind_speed, 2),
            "gdd": round(gdd, 2),
            "soil_quality": round(soil_quality, 2),
            "growing_days": growing_days,
            "yield": round(yield_value, 2),
        })
    
    return pd.DataFrame(data)


def generate_nasa_like_data(
    latitude: float,
    longitude: float,
    crop: str,
    n_years: int = 10
) -> pd.DataFrame:
    """
    Generate data that mimics NASA POWER API output for a specific location
    """
    # Determine climate zone from latitude
    abs_lat = abs(latitude)
    if abs_lat < 23.5:
        zone = "tropical"
    elif abs_lat < 35:
        zone = "subtropical"
    elif abs_lat < 55:
        zone = "temperate"
    else:
        zone = "continental"
    
    climate = CLIMATE_ZONES[zone]
    
    # Adjust for longitude (continental vs coastal)
    # Simple heuristic: coastal areas have more moderate temps
    is_coastal = abs(longitude) > 150 or abs(longitude) < 30
    if is_coastal:
        climate = climate.copy()
        climate["temp_std"] *= 0.7
        climate["precip_mean"] *= 1.2
    
    data = []
    current_year = datetime.now().year
    
    for year in range(current_year - n_years, current_year + 1):
        for month in range(1, 13):
            seasonal_factor = np.sin((month - 3) * np.pi / 6)
            if latitude < 0:
                seasonal_factor *= -1  # Flip for southern hemisphere
            
            temp_avg = climate["temp_mean"] + seasonal_factor * climate["temp_std"]
            temp_avg += np.random.normal(0, 2)
            
            data.append({
                "year": year,
                "month": month,
                "temp_avg": round(temp_avg, 2),
                "temp_min": round(temp_avg - np.random.uniform(5, 12), 2),
                "temp_max": round(temp_avg + np.random.uniform(5, 12), 2),
                "precipitation": round(max(0, climate["precip_mean"] + np.random.normal(0, climate["precip_std"])), 2),
                "humidity": round(np.clip(climate["humidity_mean"] + np.random.normal(0, 10), 10, 100), 2),
                "solar_radiation": round(np.clip(climate["solar_mean"] + np.random.normal(0, 3), 5, 30), 2),
            })
    
    return pd.DataFrame(data)
