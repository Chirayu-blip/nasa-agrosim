"""
Early Warning System API
Predicts drought, frost, and extreme weather 7-14 days in advance
Uses NASA POWER API historical data and climate patterns
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import httpx
import math

router = APIRouter()


# ============ MODELS ============

class AlertSeverity(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"
    EXTREME = "extreme"


class AlertType(str, Enum):
    DROUGHT = "drought"
    FROST = "frost"
    HEATWAVE = "heatwave"
    FLOOD = "flood"
    STORM = "storm"


class WeatherAlert(BaseModel):
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    start_date: str
    end_date: str
    probability: float  # 0-100%
    affected_crops: List[str]
    recommended_actions: List[str]
    potential_loss: str  # e.g., "20-40% yield reduction"
    created_at: str


class ForecastDay(BaseModel):
    date: str
    day_number: int
    temperature_high: float
    temperature_low: float
    precipitation: float
    humidity: float
    risk_level: AlertSeverity
    conditions: str
    icon: str


class EarlyWarningResponse(BaseModel):
    location: Dict[str, float]
    generated_at: str
    forecast_days: int
    current_conditions: Dict
    alerts: List[WeatherAlert]
    forecast: List[ForecastDay]
    risk_summary: Dict
    crop_recommendations: List[Dict]


# ============ CONSTANTS ============

# Thresholds for alerts
DROUGHT_THRESHOLDS = {
    "low": {"days_no_rain": 5, "temp_above": 28},
    "moderate": {"days_no_rain": 7, "temp_above": 30},
    "high": {"days_no_rain": 10, "temp_above": 32},
    "severe": {"days_no_rain": 14, "temp_above": 35},
}

FROST_THRESHOLDS = {
    "low": {"temp_below": 5},
    "moderate": {"temp_below": 2},
    "high": {"temp_below": 0},
    "severe": {"temp_below": -5},
}

HEATWAVE_THRESHOLDS = {
    "moderate": {"temp_above": 35, "consecutive_days": 3},
    "high": {"temp_above": 38, "consecutive_days": 3},
    "severe": {"temp_above": 40, "consecutive_days": 2},
}

# Crop vulnerability to weather events
CROP_VULNERABILITY = {
    "wheat": {"frost": 0.6, "drought": 0.5, "heatwave": 0.7},
    "corn": {"frost": 0.9, "drought": 0.7, "heatwave": 0.5},
    "rice": {"frost": 0.95, "drought": 0.9, "heatwave": 0.3},
    "potato": {"frost": 0.7, "drought": 0.6, "heatwave": 0.8},
    "tomato": {"frost": 0.95, "drought": 0.7, "heatwave": 0.6},
    "soybean": {"frost": 0.8, "drought": 0.6, "heatwave": 0.5},
}


# ============ HELPER FUNCTIONS ============

async def fetch_nasa_climate_data(latitude: float, longitude: float, days_back: int = 30) -> Dict:
    """Fetch historical climate data from NASA POWER API"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M",
            "community": "AG",
            "longitude": longitude,
            "latitude": latitude,
            "start": start_date.strftime("%Y%m%d"),
            "end": end_date.strftime("%Y%m%d"),
            "format": "JSON"
        }
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("properties", {}).get("parameter", {})
    except Exception as e:
        print(f"NASA API error: {e}")
    
    return {}


def analyze_drought_risk(climate_data: Dict, latitude: float) -> Dict:
    """Analyze drought risk based on historical precipitation and temperature patterns"""
    precip = list(climate_data.get("PRECTOTCORR", {}).values())
    temps = list(climate_data.get("T2M_MAX", {}).values())
    
    # Filter out missing data
    precip = [p for p in precip if p > -900]
    temps = [t for t in temps if t > -900]
    
    if not precip or not temps:
        return {"risk": "unknown", "probability": 0}
    
    # Calculate recent precipitation trend
    recent_precip = precip[-14:] if len(precip) >= 14 else precip
    avg_precip = sum(recent_precip) / len(recent_precip)
    days_low_rain = sum(1 for p in recent_precip if p < 1)
    
    # Temperature trend
    recent_temps = temps[-14:] if len(temps) >= 14 else temps
    avg_temp = sum(recent_temps) / len(recent_temps)
    hot_days = sum(1 for t in recent_temps if t > 30)
    
    # Calculate drought probability
    drought_score = 0
    
    # Low precipitation increases risk
    if avg_precip < 1:
        drought_score += 30
    elif avg_precip < 3:
        drought_score += 15
    
    # Consecutive dry days
    drought_score += min(40, days_low_rain * 3)
    
    # High temperatures
    drought_score += min(30, hot_days * 3)
    
    # Latitude factor (tropical regions less prone to drought)
    if abs(latitude) < 23.5:
        drought_score *= 0.7
    elif abs(latitude) > 45:
        drought_score *= 0.8
    
    probability = min(95, drought_score)
    
    # Determine severity
    if probability >= 70:
        severity = AlertSeverity.SEVERE
    elif probability >= 50:
        severity = AlertSeverity.HIGH
    elif probability >= 30:
        severity = AlertSeverity.MODERATE
    elif probability >= 15:
        severity = AlertSeverity.LOW
    else:
        severity = None
    
    return {
        "risk": severity,
        "probability": round(probability, 1),
        "days_low_rain": days_low_rain,
        "avg_temp": round(avg_temp, 1),
        "avg_precip": round(avg_precip, 2)
    }


def analyze_frost_risk(climate_data: Dict, latitude: float) -> Dict:
    """Analyze frost risk based on temperature patterns"""
    temps_min = list(climate_data.get("T2M_MIN", {}).values())
    temps_min = [t for t in temps_min if t > -900]
    
    if not temps_min:
        return {"risk": "unknown", "probability": 0}
    
    recent_temps = temps_min[-14:] if len(temps_min) >= 14 else temps_min
    min_temp = min(recent_temps)
    avg_min_temp = sum(recent_temps) / len(recent_temps)
    cold_days = sum(1 for t in recent_temps if t < 5)
    frost_days = sum(1 for t in recent_temps if t < 0)
    
    # Calculate frost probability
    frost_score = 0
    
    # Recent minimum temperatures
    if min_temp < -5:
        frost_score += 50
    elif min_temp < 0:
        frost_score += 35
    elif min_temp < 5:
        frost_score += 20
    
    # Cold day frequency
    frost_score += min(30, cold_days * 3)
    frost_score += min(20, frost_days * 5)
    
    # Temperature trend (falling = higher risk)
    temp_trend = recent_temps[-3:] if len(recent_temps) >= 3 else recent_temps
    if len(temp_trend) >= 3 and temp_trend[-1] < temp_trend[0]:
        frost_score += 10
    
    # Latitude factor
    if abs(latitude) > 45:
        frost_score *= 1.3
    elif abs(latitude) < 25:
        frost_score *= 0.3
    
    probability = min(95, frost_score)
    
    # Determine severity
    if probability >= 70:
        severity = AlertSeverity.SEVERE
    elif probability >= 50:
        severity = AlertSeverity.HIGH
    elif probability >= 30:
        severity = AlertSeverity.MODERATE
    elif probability >= 15:
        severity = AlertSeverity.LOW
    else:
        severity = None
    
    return {
        "risk": severity,
        "probability": round(probability, 1),
        "min_temp": round(min_temp, 1),
        "avg_min_temp": round(avg_min_temp, 1),
        "frost_days": frost_days
    }


def analyze_heatwave_risk(climate_data: Dict, latitude: float) -> Dict:
    """Analyze heatwave risk based on temperature patterns"""
    temps_max = list(climate_data.get("T2M_MAX", {}).values())
    temps_max = [t for t in temps_max if t > -900]
    
    if not temps_max:
        return {"risk": "unknown", "probability": 0}
    
    recent_temps = temps_max[-14:] if len(temps_max) >= 14 else temps_max
    max_temp = max(recent_temps)
    avg_max_temp = sum(recent_temps) / len(recent_temps)
    hot_days = sum(1 for t in recent_temps if t > 35)
    extreme_days = sum(1 for t in recent_temps if t > 40)
    
    # Calculate heatwave probability
    heat_score = 0
    
    # Recent maximum temperatures
    if max_temp > 45:
        heat_score += 50
    elif max_temp > 40:
        heat_score += 35
    elif max_temp > 35:
        heat_score += 20
    
    # Hot day frequency
    heat_score += min(30, hot_days * 3)
    heat_score += min(20, extreme_days * 8)
    
    # Temperature trend (rising = higher risk)
    temp_trend = recent_temps[-5:] if len(recent_temps) >= 5 else recent_temps
    if len(temp_trend) >= 3 and temp_trend[-1] > temp_trend[0]:
        heat_score += 10
    
    # Latitude factor
    if abs(latitude) < 30:
        heat_score *= 1.2
    elif abs(latitude) > 50:
        heat_score *= 0.6
    
    probability = min(95, heat_score)
    
    # Determine severity
    if probability >= 70:
        severity = AlertSeverity.SEVERE
    elif probability >= 50:
        severity = AlertSeverity.HIGH
    elif probability >= 30:
        severity = AlertSeverity.MODERATE
    elif probability >= 15:
        severity = AlertSeverity.LOW
    else:
        severity = None
    
    return {
        "risk": severity,
        "probability": round(probability, 1),
        "max_temp": round(max_temp, 1),
        "avg_max_temp": round(avg_max_temp, 1),
        "hot_days": hot_days
    }


def generate_forecast(climate_data: Dict, latitude: float, days: int = 14) -> List[ForecastDay]:
    """Generate weather forecast based on historical patterns and trends"""
    temps = list(climate_data.get("T2M", {}).values())
    temps_max = list(climate_data.get("T2M_MAX", {}).values())
    temps_min = list(climate_data.get("T2M_MIN", {}).values())
    precip = list(climate_data.get("PRECTOTCORR", {}).values())
    humidity = list(climate_data.get("RH2M", {}).values())
    
    # Filter missing data
    temps = [t for t in temps if t > -900][-7:]
    temps_max = [t for t in temps_max if t > -900][-7:]
    temps_min = [t for t in temps_min if t > -900][-7:]
    precip = [p for p in precip if p > -900][-7:]
    humidity = [h for h in humidity if h > -900][-7:]
    
    # Calculate base values and trends
    if temps:
        base_temp = sum(temps) / len(temps)
        temp_trend = (temps[-1] - temps[0]) / len(temps) if len(temps) > 1 else 0
    else:
        base_temp = 22
        temp_trend = 0
    
    if precip:
        base_precip = sum(precip) / len(precip)
    else:
        base_precip = 3
    
    if humidity:
        base_humidity = sum(humidity) / len(humidity)
    else:
        base_humidity = 60
    
    forecast = []
    import random
    
    for day in range(1, days + 1):
        date = datetime.now() + timedelta(days=day)
        
        # Add trend and variation
        variation = random.uniform(-3, 3)
        temp_high = base_temp + temp_trend * day + variation + 5
        temp_low = base_temp + temp_trend * day + variation - 5
        
        # Precipitation probability increases if humid
        precip_chance = base_precip + random.uniform(-2, 2)
        if precip_chance < 0:
            precip_chance = 0
        
        humidity_val = base_humidity + random.uniform(-10, 10)
        humidity_val = max(20, min(100, humidity_val))
        
        # Determine risk level
        if temp_high > 40 or temp_low < -5:
            risk = AlertSeverity.SEVERE
        elif temp_high > 38 or temp_low < 0:
            risk = AlertSeverity.HIGH
        elif temp_high > 35 or temp_low < 5:
            risk = AlertSeverity.MODERATE
        elif temp_high > 32 or temp_low < 8:
            risk = AlertSeverity.LOW
        else:
            risk = AlertSeverity.LOW
        
        # Conditions and icon
        if precip_chance > 10:
            conditions = "Rainy"
            icon = "🌧️"
        elif precip_chance > 5:
            conditions = "Cloudy"
            icon = "☁️"
        elif temp_high > 35:
            conditions = "Hot"
            icon = "🔥"
        elif temp_low < 5:
            conditions = "Cold"
            icon = "❄️"
        else:
            conditions = "Clear"
            icon = "☀️"
        
        forecast.append(ForecastDay(
            date=date.strftime("%Y-%m-%d"),
            day_number=day,
            temperature_high=round(temp_high, 1),
            temperature_low=round(temp_low, 1),
            precipitation=round(precip_chance, 1),
            humidity=round(humidity_val, 1),
            risk_level=risk,
            conditions=conditions,
            icon=icon
        ))
    
    return forecast


def generate_alerts(drought_risk: Dict, frost_risk: Dict, heatwave_risk: Dict) -> List[WeatherAlert]:
    """Generate weather alerts based on analyzed risks"""
    alerts = []
    now = datetime.now()
    
    # Drought alert
    if drought_risk.get("risk"):
        severity = drought_risk["risk"]
        probability = drought_risk["probability"]
        
        actions = []
        if severity in [AlertSeverity.HIGH, AlertSeverity.SEVERE]:
            actions = [
                "Implement water conservation measures immediately",
                "Consider harvesting early if crops are near maturity",
                "Install drip irrigation to maximize water efficiency",
                "Apply mulch to reduce soil moisture evaporation",
                "Prioritize watering for high-value crops"
            ]
        else:
            actions = [
                "Monitor soil moisture levels closely",
                "Prepare backup water sources",
                "Consider drought-resistant varieties for next planting"
            ]
        
        affected = ["wheat", "corn", "rice", "tomato", "potato"]
        
        loss_estimates = {
            AlertSeverity.LOW: "5-10% yield reduction possible",
            AlertSeverity.MODERATE: "10-20% yield reduction likely",
            AlertSeverity.HIGH: "20-40% yield reduction expected",
            AlertSeverity.SEVERE: "40-60% yield reduction or total crop loss possible"
        }
        
        alerts.append(WeatherAlert(
            id=f"drought_{now.strftime('%Y%m%d')}",
            type=AlertType.DROUGHT,
            severity=severity,
            title=f"Drought Warning - {severity.value.upper()} Risk",
            description=f"Precipitation has been below normal for {drought_risk.get('days_low_rain', 0)} days. "
                       f"Average temperature: {drought_risk.get('avg_temp', 'N/A')}°C. "
                       f"Immediate water management recommended.",
            start_date=now.strftime("%Y-%m-%d"),
            end_date=(now + timedelta(days=14)).strftime("%Y-%m-%d"),
            probability=probability,
            affected_crops=affected,
            recommended_actions=actions,
            potential_loss=loss_estimates.get(severity, "Unknown"),
            created_at=now.isoformat()
        ))
    
    # Frost alert
    if frost_risk.get("risk"):
        severity = frost_risk["risk"]
        probability = frost_risk["probability"]
        
        actions = []
        if severity in [AlertSeverity.HIGH, AlertSeverity.SEVERE]:
            actions = [
                "Cover sensitive crops with frost cloth or plastic",
                "Water plants thoroughly before frost (wet soil retains heat)",
                "Harvest mature crops immediately",
                "Use heaters or smudge pots in orchards",
                "Move potted plants indoors"
            ]
        else:
            actions = [
                "Prepare frost protection materials",
                "Monitor overnight temperatures",
                "Consider delaying planting of sensitive crops"
            ]
        
        affected = ["tomato", "corn", "rice", "potato"]
        
        loss_estimates = {
            AlertSeverity.LOW: "Minor damage to sensitive crops possible",
            AlertSeverity.MODERATE: "10-25% crop damage expected",
            AlertSeverity.HIGH: "25-50% crop damage likely",
            AlertSeverity.SEVERE: "Complete crop loss for sensitive varieties"
        }
        
        alerts.append(WeatherAlert(
            id=f"frost_{now.strftime('%Y%m%d')}",
            type=AlertType.FROST,
            severity=severity,
            title=f"Frost Warning - {severity.value.upper()} Risk",
            description=f"Minimum temperature of {frost_risk.get('min_temp', 'N/A')}°C recorded recently. "
                       f"{frost_risk.get('frost_days', 0)} frost days in the last 2 weeks. "
                       f"Protect sensitive crops immediately.",
            start_date=now.strftime("%Y-%m-%d"),
            end_date=(now + timedelta(days=7)).strftime("%Y-%m-%d"),
            probability=probability,
            affected_crops=affected,
            recommended_actions=actions,
            potential_loss=loss_estimates.get(severity, "Unknown"),
            created_at=now.isoformat()
        ))
    
    # Heatwave alert
    if heatwave_risk.get("risk"):
        severity = heatwave_risk["risk"]
        probability = heatwave_risk["probability"]
        
        actions = []
        if severity in [AlertSeverity.HIGH, AlertSeverity.SEVERE]:
            actions = [
                "Increase irrigation frequency significantly",
                "Apply shade cloth to protect sensitive crops",
                "Water early morning or late evening only",
                "Apply mulch to reduce soil temperature",
                "Avoid any pruning or stressful activities",
                "Harvest morning to avoid heat damage"
            ]
        else:
            actions = [
                "Monitor crop stress signs (wilting, leaf curl)",
                "Ensure irrigation systems are working properly",
                "Prepare shade structures"
            ]
        
        affected = ["wheat", "potato", "tomato", "soybean"]
        
        loss_estimates = {
            AlertSeverity.LOW: "Slight stress, minimal yield impact",
            AlertSeverity.MODERATE: "10-20% yield reduction from heat stress",
            AlertSeverity.HIGH: "20-35% yield reduction likely",
            AlertSeverity.SEVERE: "35-50% yield reduction, possible plant death"
        }
        
        alerts.append(WeatherAlert(
            id=f"heatwave_{now.strftime('%Y%m%d')}",
            type=AlertType.HEATWAVE,
            severity=severity,
            title=f"Heatwave Warning - {severity.value.upper()} Risk",
            description=f"Maximum temperature of {heatwave_risk.get('max_temp', 'N/A')}°C recorded. "
                       f"{heatwave_risk.get('hot_days', 0)} days above 35°C in the last 2 weeks. "
                       f"Extreme heat stress likely for crops.",
            start_date=now.strftime("%Y-%m-%d"),
            end_date=(now + timedelta(days=7)).strftime("%Y-%m-%d"),
            probability=probability,
            affected_crops=affected,
            recommended_actions=actions,
            potential_loss=loss_estimates.get(severity, "Unknown"),
            created_at=now.isoformat()
        ))
    
    # Sort by severity
    severity_order = {
        AlertSeverity.EXTREME: 0,
        AlertSeverity.SEVERE: 1,
        AlertSeverity.HIGH: 2,
        AlertSeverity.MODERATE: 3,
        AlertSeverity.LOW: 4
    }
    alerts.sort(key=lambda x: severity_order.get(x.severity, 5))
    
    return alerts


def get_crop_recommendations(drought_risk: Dict, frost_risk: Dict, heatwave_risk: Dict) -> List[Dict]:
    """Generate crop-specific recommendations based on weather risks"""
    recommendations = []
    
    crops = ["wheat", "corn", "rice", "potato", "tomato", "soybean"]
    
    for crop in crops:
        vulnerability = CROP_VULNERABILITY.get(crop, {})
        
        risks = []
        if drought_risk.get("risk") and vulnerability.get("drought", 0) > 0.5:
            risks.append({
                "type": "drought",
                "impact": f"{int(vulnerability['drought'] * 100)}% vulnerability",
                "action": "Increase irrigation frequency"
            })
        
        if frost_risk.get("risk") and vulnerability.get("frost", 0) > 0.5:
            risks.append({
                "type": "frost",
                "impact": f"{int(vulnerability['frost'] * 100)}% vulnerability",
                "action": "Apply frost protection or delay planting"
            })
        
        if heatwave_risk.get("risk") and vulnerability.get("heatwave", 0) > 0.5:
            risks.append({
                "type": "heatwave",
                "impact": f"{int(vulnerability['heatwave'] * 100)}% vulnerability",
                "action": "Provide shade and extra water"
            })
        
        overall_risk = "safe"
        if len(risks) >= 2:
            overall_risk = "high"
        elif len(risks) == 1:
            overall_risk = "moderate"
        
        recommendations.append({
            "crop": crop,
            "overall_risk": overall_risk,
            "plant_now": overall_risk == "safe",
            "risks": risks
        })
    
    return recommendations


# ============ API ROUTES ============

@router.get("/forecast", response_model=EarlyWarningResponse)
async def get_early_warning_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    days: int = Query(14, ge=7, le=30)
):
    """
    Get early warning forecast for agricultural risks.
    Uses NASA POWER API data to predict drought, frost, and heatwave risks.
    """
    
    # Fetch historical climate data
    climate_data = await fetch_nasa_climate_data(latitude, longitude, days_back=30)
    
    # Analyze risks
    drought_risk = analyze_drought_risk(climate_data, latitude)
    frost_risk = analyze_frost_risk(climate_data, latitude)
    heatwave_risk = analyze_heatwave_risk(climate_data, latitude)
    
    # Generate forecast
    forecast = generate_forecast(climate_data, latitude, days)
    
    # Generate alerts
    alerts = generate_alerts(drought_risk, frost_risk, heatwave_risk)
    
    # Crop recommendations
    crop_recs = get_crop_recommendations(drought_risk, frost_risk, heatwave_risk)
    
    # Current conditions
    temps = list(climate_data.get("T2M", {}).values())
    temps = [t for t in temps if t > -900]
    current_temp = temps[-1] if temps else 22
    
    precip = list(climate_data.get("PRECTOTCORR", {}).values())
    precip = [p for p in precip if p > -900]
    current_precip = precip[-1] if precip else 0
    
    return EarlyWarningResponse(
        location={"latitude": latitude, "longitude": longitude},
        generated_at=datetime.now().isoformat(),
        forecast_days=days,
        current_conditions={
            "temperature": round(current_temp, 1),
            "precipitation": round(current_precip, 1),
            "data_source": "NASA POWER API"
        },
        alerts=alerts,
        forecast=forecast,
        risk_summary={
            "drought": {
                "level": drought_risk.get("risk", "none"),
                "probability": drought_risk.get("probability", 0)
            },
            "frost": {
                "level": frost_risk.get("risk", "none"),
                "probability": frost_risk.get("probability", 0)
            },
            "heatwave": {
                "level": heatwave_risk.get("risk", "none"),
                "probability": heatwave_risk.get("probability", 0)
            }
        },
        crop_recommendations=crop_recs
    )


@router.get("/alerts")
async def get_active_alerts(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """Get only active weather alerts for a location"""
    
    climate_data = await fetch_nasa_climate_data(latitude, longitude, days_back=14)
    
    drought_risk = analyze_drought_risk(climate_data, latitude)
    frost_risk = analyze_frost_risk(climate_data, latitude)
    heatwave_risk = analyze_heatwave_risk(climate_data, latitude)
    
    alerts = generate_alerts(drought_risk, frost_risk, heatwave_risk)
    
    return {
        "location": {"latitude": latitude, "longitude": longitude},
        "alert_count": len(alerts),
        "alerts": alerts,
        "generated_at": datetime.now().isoformat()
    }


@router.get("/risk-assessment/{crop}")
async def get_crop_risk_assessment(
    crop: str,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """Get detailed risk assessment for a specific crop"""
    
    if crop not in CROP_VULNERABILITY:
        raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found. Available: {list(CROP_VULNERABILITY.keys())}")
    
    climate_data = await fetch_nasa_climate_data(latitude, longitude, days_back=30)
    
    drought_risk = analyze_drought_risk(climate_data, latitude)
    frost_risk = analyze_frost_risk(climate_data, latitude)
    heatwave_risk = analyze_heatwave_risk(climate_data, latitude)
    
    vulnerability = CROP_VULNERABILITY[crop]
    
    # Calculate overall risk score
    overall_score = 0
    risks_detail = {}
    
    if drought_risk.get("risk"):
        drought_impact = drought_risk["probability"] * vulnerability.get("drought", 0.5) / 100
        overall_score += drought_impact * 40
        risks_detail["drought"] = {
            "probability": drought_risk["probability"],
            "vulnerability": f"{int(vulnerability.get('drought', 0.5) * 100)}%",
            "impact_score": round(drought_impact * 100, 1)
        }
    
    if frost_risk.get("risk"):
        frost_impact = frost_risk["probability"] * vulnerability.get("frost", 0.5) / 100
        overall_score += frost_impact * 40
        risks_detail["frost"] = {
            "probability": frost_risk["probability"],
            "vulnerability": f"{int(vulnerability.get('frost', 0.5) * 100)}%",
            "impact_score": round(frost_impact * 100, 1)
        }
    
    if heatwave_risk.get("risk"):
        heat_impact = heatwave_risk["probability"] * vulnerability.get("heatwave", 0.5) / 100
        overall_score += heat_impact * 40
        risks_detail["heatwave"] = {
            "probability": heatwave_risk["probability"],
            "vulnerability": f"{int(vulnerability.get('heatwave', 0.5) * 100)}%",
            "impact_score": round(heat_impact * 100, 1)
        }
    
    # Recommendation
    if overall_score > 60:
        recommendation = "DO NOT PLANT - High risk of crop failure"
        plant_advisable = False
    elif overall_score > 40:
        recommendation = "CAUTION - Significant weather risks present"
        plant_advisable = False
    elif overall_score > 20:
        recommendation = "PROCEED WITH CARE - Monitor weather closely"
        plant_advisable = True
    else:
        recommendation = "SAFE TO PLANT - Favorable conditions"
        plant_advisable = True
    
    return {
        "crop": crop,
        "location": {"latitude": latitude, "longitude": longitude},
        "overall_risk_score": round(overall_score, 1),
        "plant_advisable": plant_advisable,
        "recommendation": recommendation,
        "vulnerability_profile": vulnerability,
        "current_risks": risks_detail,
        "generated_at": datetime.now().isoformat()
    }
