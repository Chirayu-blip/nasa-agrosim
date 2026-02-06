"""
NASA Data API Routes
Fetches real climate and agricultural data from NASA POWER API
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import httpx
from datetime import datetime, timedelta

router = APIRouter()

NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Parameters useful for agriculture
AGRO_PARAMETERS = [
    "T2M",           # Temperature at 2 meters (°C)
    "T2M_MAX",       # Max temperature
    "T2M_MIN",       # Min temperature
    "PRECTOTCORR",   # Precipitation (mm/day)
    "RH2M",          # Relative humidity at 2m (%)
    "WS2M",          # Wind speed at 2m (m/s)
    "ALLSKY_SFC_SW_DWN",  # Solar radiation (MJ/m²/day)
    "GWETTOP",       # Surface soil wetness (0-1)
    "EVPTRNS",       # Evapotranspiration (mm/day)
]


@router.get("/climate")
async def get_climate_data(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude"),
    start_date: Optional[str] = Query(None, description="Start date (YYYYMMDD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYYMMDD)")
):
    """
    Fetch climate data from NASA POWER API for agricultural analysis.
    
    Returns temperature, precipitation, humidity, solar radiation, and soil data.
    """
    
    # Default to last 30 days if not specified
    if not end_date:
        end_date = datetime.now().strftime("%Y%m%d")
    if not start_date:
        start = datetime.now() - timedelta(days=30)
        start_date = start.strftime("%Y%m%d")
    
    params = {
        "parameters": ",".join(AGRO_PARAMETERS),
        "community": "AG",  # Agricultural community
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date,
        "end": end_date,
        "format": "JSON"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(NASA_POWER_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process and return relevant data
            return {
                "location": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "period": {
                    "start": start_date,
                    "end": end_date
                },
                "parameters": data.get("properties", {}).get("parameter", {}),
                "summary": calculate_climate_summary(data)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"NASA API error: {str(e)}")


def calculate_climate_summary(data: dict) -> dict:
    """Calculate summary statistics from NASA data"""
    
    params = data.get("properties", {}).get("parameter", {})
    
    summary = {}
    
    # Temperature summary
    if "T2M" in params:
        temps = [v for v in params["T2M"].values() if v != -999]
        if temps:
            summary["avg_temperature"] = round(sum(temps) / len(temps), 1)
            summary["max_temperature"] = round(max(temps), 1)
            summary["min_temperature"] = round(min(temps), 1)
    
    # Precipitation summary
    if "PRECTOTCORR" in params:
        precip = [v for v in params["PRECTOTCORR"].values() if v != -999]
        if precip:
            summary["total_precipitation"] = round(sum(precip), 1)
            summary["avg_daily_precipitation"] = round(sum(precip) / len(precip), 2)
    
    # Humidity summary
    if "RH2M" in params:
        humidity = [v for v in params["RH2M"].values() if v != -999]
        if humidity:
            summary["avg_humidity"] = round(sum(humidity) / len(humidity), 1)
    
    # Solar radiation summary
    if "ALLSKY_SFC_SW_DWN" in params:
        solar = [v for v in params["ALLSKY_SFC_SW_DWN"].values() if v != -999]
        if solar:
            summary["avg_solar_radiation"] = round(sum(solar) / len(solar), 2)
    
    return summary


@router.get("/growing-conditions")
async def get_growing_conditions(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """
    Analyze current growing conditions based on NASA data.
    Returns suitability scores for different crop types.
    """
    
    # Get recent climate data (last 7 days)
    end_date = datetime.now().strftime("%Y%m%d")
    start = datetime.now() - timedelta(days=7)
    start_date = start.strftime("%Y%m%d")
    
    params = {
        "parameters": ",".join(AGRO_PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date,
        "end": end_date,
        "format": "JSON"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(NASA_POWER_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            conditions = analyze_growing_conditions(data)
            return conditions
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"NASA API error: {str(e)}")


def analyze_growing_conditions(data: dict) -> dict:
    """Analyze NASA data to determine growing conditions"""
    
    params = data.get("properties", {}).get("parameter", {})
    
    # Calculate averages
    avg_temp = 20  # Default
    avg_precip = 0
    avg_humidity = 50
    
    if "T2M" in params:
        temps = [v for v in params["T2M"].values() if v != -999]
        if temps:
            avg_temp = sum(temps) / len(temps)
    
    if "PRECTOTCORR" in params:
        precip = [v for v in params["PRECTOTCORR"].values() if v != -999]
        if precip:
            avg_precip = sum(precip) / len(precip)
    
    if "RH2M" in params:
        humidity = [v for v in params["RH2M"].values() if v != -999]
        if humidity:
            avg_humidity = sum(humidity) / len(humidity)
    
    # Determine overall conditions
    conditions = {
        "temperature": {
            "value": round(avg_temp, 1),
            "unit": "°C",
            "status": "optimal" if 15 <= avg_temp <= 30 else "suboptimal"
        },
        "precipitation": {
            "value": round(avg_precip, 2),
            "unit": "mm/day",
            "status": "optimal" if 2 <= avg_precip <= 10 else "suboptimal"
        },
        "humidity": {
            "value": round(avg_humidity, 1),
            "unit": "%",
            "status": "optimal" if 40 <= avg_humidity <= 70 else "suboptimal"
        },
        "recommendations": generate_recommendations(avg_temp, avg_precip, avg_humidity)
    }
    
    return conditions


def generate_recommendations(temp: float, precip: float, humidity: float) -> list:
    """Generate farming recommendations based on conditions"""
    
    recommendations = []
    
    if temp < 15:
        recommendations.append("Consider cold-resistant crops like wheat, barley, or leafy greens")
    elif temp > 30:
        recommendations.append("High temperatures detected. Ensure adequate irrigation and consider heat-tolerant varieties")
    else:
        recommendations.append("Temperature is optimal for most crops")
    
    if precip < 2:
        recommendations.append("Low precipitation. Irrigation will be essential for crop success")
    elif precip > 10:
        recommendations.append("High precipitation. Ensure proper drainage to prevent waterlogging")
    
    if humidity < 40:
        recommendations.append("Low humidity may increase water requirements. Monitor soil moisture closely")
    elif humidity > 70:
        recommendations.append("High humidity increases disease risk. Consider fungicide applications")
    
    return recommendations
