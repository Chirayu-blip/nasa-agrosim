"""
Crops API Routes
Manage crop types, requirements, and growth simulation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

router = APIRouter()


class CropType(str, Enum):
    WHEAT = "wheat"
    CORN = "corn"
    RICE = "rice"
    SOYBEAN = "soybean"
    TOMATO = "tomato"
    POTATO = "potato"


class CropRequirements(BaseModel):
    min_temp: float
    max_temp: float
    optimal_temp: float
    water_needs: str  # low, medium, high
    growing_days: int
    soil_type: List[str]


class Crop(BaseModel):
    id: str
    name: str
    type: CropType
    requirements: CropRequirements
    description: str
    yield_per_hectare: float  # tons
    price_per_ton: float  # USD
    icon: str


# Crop database
CROPS_DATABASE = {
    "wheat": Crop(
        id="wheat",
        name="Wheat",
        type=CropType.WHEAT,
        requirements=CropRequirements(
            min_temp=3,
            max_temp=32,
            optimal_temp=20,
            water_needs="medium",
            growing_days=120,
            soil_type=["loam", "clay-loam"]
        ),
        description="A staple grain crop adaptable to various climates. Best grown in temperate regions with moderate rainfall.",
        yield_per_hectare=3.5,
        price_per_ton=250,
        icon="🌾"
    ),
    "corn": Crop(
        id="corn",
        name="Corn (Maize)",
        type=CropType.CORN,
        requirements=CropRequirements(
            min_temp=10,
            max_temp=35,
            optimal_temp=25,
            water_needs="high",
            growing_days=90,
            soil_type=["loam", "sandy-loam"]
        ),
        description="High-yielding grain requiring warm temperatures and consistent moisture throughout the growing season.",
        yield_per_hectare=10.0,
        price_per_ton=180,
        icon="🌽"
    ),
    "rice": Crop(
        id="rice",
        name="Rice",
        type=CropType.RICE,
        requirements=CropRequirements(
            min_temp=20,
            max_temp=38,
            optimal_temp=30,
            water_needs="high",
            growing_days=150,
            soil_type=["clay", "clay-loam"]
        ),
        description="Requires flooded conditions and warm temperatures. Major food crop for billions worldwide.",
        yield_per_hectare=4.5,
        price_per_ton=350,
        icon="🍚"
    ),
    "soybean": Crop(
        id="soybean",
        name="Soybean",
        type=CropType.SOYBEAN,
        requirements=CropRequirements(
            min_temp=15,
            max_temp=30,
            optimal_temp=25,
            water_needs="medium",
            growing_days=100,
            soil_type=["loam", "sandy-loam", "clay-loam"]
        ),
        description="Nitrogen-fixing legume excellent for crop rotation. Versatile crop used for food, feed, and oil.",
        yield_per_hectare=2.8,
        price_per_ton=400,
        icon="🫘"
    ),
    "tomato": Crop(
        id="tomato",
        name="Tomato",
        type=CropType.TOMATO,
        requirements=CropRequirements(
            min_temp=15,
            max_temp=35,
            optimal_temp=24,
            water_needs="medium",
            growing_days=70,
            soil_type=["loam", "sandy-loam"]
        ),
        description="Popular vegetable crop requiring warm days and consistent watering. High value per hectare.",
        yield_per_hectare=50.0,
        price_per_ton=150,
        icon="🍅"
    ),
    "potato": Crop(
        id="potato",
        name="Potato",
        type=CropType.POTATO,
        requirements=CropRequirements(
            min_temp=7,
            max_temp=25,
            optimal_temp=18,
            water_needs="medium",
            growing_days=100,
            soil_type=["sandy-loam", "loam"]
        ),
        description="Cool-weather crop grown for its starchy tubers. Adaptable to various conditions.",
        yield_per_hectare=40.0,
        price_per_ton=120,
        icon="🥔"
    )
}


@router.get("/", response_model=List[Crop])
async def get_all_crops():
    """Get all available crops"""
    return list(CROPS_DATABASE.values())


@router.get("/{crop_id}", response_model=Crop)
async def get_crop(crop_id: str):
    """Get details for a specific crop"""
    if crop_id not in CROPS_DATABASE:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")
    return CROPS_DATABASE[crop_id]


@router.get("/suitable/{crop_id}")
async def check_crop_suitability(
    crop_id: str,
    temperature: float,
    precipitation: float,
    humidity: float
):
    """
    Check if a crop is suitable for given conditions.
    Returns suitability score and recommendations.
    """
    if crop_id not in CROPS_DATABASE:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_id}' not found")
    
    crop = CROPS_DATABASE[crop_id]
    req = crop.requirements
    
    # Calculate temperature score (0-100)
    if req.min_temp <= temperature <= req.max_temp:
        temp_diff = abs(temperature - req.optimal_temp)
        temp_score = max(0, 100 - (temp_diff * 5))
    else:
        temp_score = 0
    
    # Calculate water score based on precipitation and needs
    water_thresholds = {
        "low": (1, 3),
        "medium": (3, 7),
        "high": (5, 12)
    }
    min_water, max_water = water_thresholds.get(req.water_needs, (3, 7))
    
    if min_water <= precipitation <= max_water:
        water_score = 100
    elif precipitation < min_water:
        water_score = max(0, 100 - ((min_water - precipitation) * 20))
    else:
        water_score = max(0, 100 - ((precipitation - max_water) * 10))
    
    # Overall suitability
    overall_score = (temp_score * 0.5) + (water_score * 0.5)
    
    # Determine status
    if overall_score >= 70:
        status = "excellent"
    elif overall_score >= 50:
        status = "good"
    elif overall_score >= 30:
        status = "challenging"
    else:
        status = "poor"
    
    # Generate tips
    tips = []
    if temp_score < 50:
        if temperature < req.optimal_temp:
            tips.append(f"Temperature is below optimal. Consider greenhouses or wait for warmer weather.")
        else:
            tips.append(f"Temperature is above optimal. Provide shade and increase irrigation.")
    
    if water_score < 50:
        if precipitation < min_water:
            tips.append(f"Insufficient rainfall. Irrigation will be required.")
        else:
            tips.append(f"Excessive rainfall. Ensure proper drainage.")
    
    return {
        "crop": crop.name,
        "suitability": {
            "overall_score": round(overall_score, 1),
            "temperature_score": round(temp_score, 1),
            "water_score": round(water_score, 1),
            "status": status
        },
        "conditions": {
            "current_temp": temperature,
            "optimal_temp": req.optimal_temp,
            "current_precipitation": precipitation,
            "water_needs": req.water_needs
        },
        "tips": tips,
        "expected_yield_modifier": round(overall_score / 100, 2)
    }


@router.get("/recommend/")
async def recommend_crops(
    temperature: float,
    precipitation: float,
    humidity: float
):
    """
    Recommend suitable crops based on current conditions.
    """
    recommendations = []
    
    for crop_id, crop in CROPS_DATABASE.items():
        req = crop.requirements
        
        # Check temperature compatibility
        temp_compatible = req.min_temp <= temperature <= req.max_temp
        
        # Check water compatibility
        water_thresholds = {
            "low": (0, 4),
            "medium": (2, 8),
            "high": (4, 15)
        }
        min_water, max_water = water_thresholds.get(req.water_needs, (2, 8))
        water_compatible = (precipitation >= min_water * 0.5)
        
        if temp_compatible:
            # Calculate score
            temp_diff = abs(temperature - req.optimal_temp)
            score = max(0, 100 - (temp_diff * 3))
            
            if not water_compatible:
                score *= 0.7  # Penalty for water mismatch
            
            recommendations.append({
                "crop": crop.name,
                "id": crop_id,
                "icon": crop.icon,
                "score": round(score, 1),
                "growing_days": req.growing_days,
                "potential_revenue": round(crop.yield_per_hectare * crop.price_per_ton, 2),
                "notes": f"Optimal temp: {req.optimal_temp}°C, Water needs: {req.water_needs}"
            })
    
    # Sort by score
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "conditions": {
            "temperature": temperature,
            "precipitation": precipitation,
            "humidity": humidity
        },
        "recommendations": recommendations
    }
