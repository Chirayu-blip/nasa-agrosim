"""
Weather API Routes
Simulate weather events and their impact on farming
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
import random

router = APIRouter()


class WeatherEventType(str, Enum):
    DROUGHT = "drought"
    FLOOD = "flood"
    FROST = "frost"
    HEATWAVE = "heatwave"
    STORM = "storm"
    IDEAL = "ideal"


class WeatherEvent(BaseModel):
    type: WeatherEventType
    name: str
    description: str
    impact: str
    yield_modifier: float  # 0.0 to 1.5 (0 = total loss, 1.0 = normal, 1.5 = bonus)
    duration_days: int
    icon: str


# Weather events database
WEATHER_EVENTS = {
    WeatherEventType.DROUGHT: WeatherEvent(
        type=WeatherEventType.DROUGHT,
        name="Drought",
        description="Extended period of abnormally low rainfall",
        impact="Crops suffer water stress, reduced growth and yields",
        yield_modifier=0.4,
        duration_days=14,
        icon="☀️🏜️"
    ),
    WeatherEventType.FLOOD: WeatherEvent(
        type=WeatherEventType.FLOOD,
        name="Flooding",
        description="Excessive rainfall causing waterlogging",
        impact="Root damage, nutrient leaching, potential crop loss",
        yield_modifier=0.5,
        duration_days=7,
        icon="🌊"
    ),
    WeatherEventType.FROST: WeatherEvent(
        type=WeatherEventType.FROST,
        name="Late Frost",
        description="Unexpected freezing temperatures",
        impact="Tissue damage to sensitive crops, stunted growth",
        yield_modifier=0.6,
        duration_days=3,
        icon="❄️"
    ),
    WeatherEventType.HEATWAVE: WeatherEvent(
        type=WeatherEventType.HEATWAVE,
        name="Heat Wave",
        description="Prolonged period of excessively hot weather",
        impact="Heat stress, increased water demand, potential crop failure",
        yield_modifier=0.55,
        duration_days=10,
        icon="🔥"
    ),
    WeatherEventType.STORM: WeatherEvent(
        type=WeatherEventType.STORM,
        name="Severe Storm",
        description="Heavy rain, strong winds, possible hail",
        impact="Physical damage to crops, lodging (fallen plants)",
        yield_modifier=0.7,
        duration_days=2,
        icon="⛈️"
    ),
    WeatherEventType.IDEAL: WeatherEvent(
        type=WeatherEventType.IDEAL,
        name="Ideal Conditions",
        description="Perfect growing weather",
        impact="Optimal growth, potential for above-average yields",
        yield_modifier=1.2,
        duration_days=14,
        icon="🌤️"
    )
}


class WeatherForecast(BaseModel):
    day: int
    temperature: float
    precipitation: float
    humidity: float
    conditions: str
    icon: str


@router.get("/events")
async def get_weather_events():
    """Get all possible weather events"""
    return list(WEATHER_EVENTS.values())


@router.get("/simulate")
async def simulate_weather_event(
    temperature: float,
    precipitation: float,
    season: str = "summer"
):
    """
    Simulate potential weather events based on conditions.
    Returns probability of different events occurring.
    """
    
    probabilities = {}
    
    # Calculate event probabilities based on conditions
    
    # Drought - high temp, low precipitation
    if precipitation < 2 and temperature > 25:
        probabilities["drought"] = min(0.7, 0.3 + (temperature - 25) * 0.05)
    else:
        probabilities["drought"] = 0.05
    
    # Flood - high precipitation
    if precipitation > 10:
        probabilities["flood"] = min(0.6, 0.2 + (precipitation - 10) * 0.1)
    else:
        probabilities["flood"] = 0.05
    
    # Frost - low temperature
    if temperature < 5:
        probabilities["frost"] = min(0.8, 0.4 + (5 - temperature) * 0.1)
    elif season in ["spring", "fall"]:
        probabilities["frost"] = 0.1
    else:
        probabilities["frost"] = 0.02
    
    # Heatwave - very high temperature
    if temperature > 32:
        probabilities["heatwave"] = min(0.7, 0.3 + (temperature - 32) * 0.1)
    else:
        probabilities["heatwave"] = 0.05
    
    # Storm - moderate chance in most conditions
    probabilities["storm"] = 0.1 if precipitation > 5 else 0.05
    
    # Ideal conditions - when nothing extreme
    extreme_risk = max(probabilities.values())
    probabilities["ideal"] = max(0, 0.5 - extreme_risk)
    
    # Determine most likely event
    most_likely = max(probabilities, key=probabilities.get)
    
    return {
        "conditions": {
            "temperature": temperature,
            "precipitation": precipitation,
            "season": season
        },
        "probabilities": probabilities,
        "most_likely_event": WEATHER_EVENTS[WeatherEventType(most_likely)],
        "risk_level": "high" if extreme_risk > 0.4 else "moderate" if extreme_risk > 0.2 else "low"
    }


@router.get("/forecast")
async def generate_forecast(
    base_temperature: float = 22,
    base_precipitation: float = 5,
    days: int = 7,
    variability: float = 0.3
):
    """
    Generate a weather forecast for the farm.
    Uses base conditions with random variation.
    """
    
    forecast = []
    conditions_map = [
        (0, 3, "Dry", "☀️"),
        (3, 8, "Partly Cloudy", "⛅"),
        (8, 15, "Cloudy", "☁️"),
        (15, 50, "Rainy", "🌧️")
    ]
    
    for day in range(1, days + 1):
        # Add some variation
        temp_var = random.uniform(-variability, variability) * 10
        precip_var = random.uniform(-variability, variability) * base_precipitation
        
        temp = round(base_temperature + temp_var, 1)
        precip = max(0, round(base_precipitation + precip_var, 1))
        humidity = min(100, max(20, round(50 + precip * 3 + random.uniform(-10, 10), 1)))
        
        # Determine conditions
        conditions = "Clear"
        icon = "☀️"
        for min_p, max_p, cond, ic in conditions_map:
            if min_p <= precip < max_p:
                conditions = cond
                icon = ic
                break
        
        forecast.append(WeatherForecast(
            day=day,
            temperature=temp,
            precipitation=precip,
            humidity=humidity,
            conditions=conditions,
            icon=icon
        ))
    
    return {
        "generated_at": "now",
        "days": days,
        "forecast": forecast,
        "weekly_summary": {
            "avg_temperature": round(sum(f.temperature for f in forecast) / len(forecast), 1),
            "total_precipitation": round(sum(f.precipitation for f in forecast), 1),
            "avg_humidity": round(sum(f.humidity for f in forecast) / len(forecast), 1)
        }
    }
