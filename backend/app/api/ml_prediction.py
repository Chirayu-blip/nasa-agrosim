"""
ML Prediction API
Endpoints for crop yield prediction using ensemble ML models
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import asyncio

router = APIRouter()


# ============ REQUEST/RESPONSE MODELS ============

class PredictionRequest(BaseModel):
    """Request model for yield prediction"""
    crop: str = Field(..., description="Crop type: wheat, corn, rice, soybean, potato, cotton, sugarcane")
    latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
    temp_avg: float = Field(..., description="Average temperature (°C)")
    temp_min: float = Field(..., description="Minimum temperature (°C)")
    temp_max: float = Field(..., description="Maximum temperature (°C)")
    precipitation: float = Field(..., ge=0, description="Monthly precipitation (mm)")
    humidity: float = Field(60, ge=0, le=100, description="Relative humidity (%)")
    solar_radiation: float = Field(18, ge=0, le=35, description="Solar radiation (MJ/m²/day)")
    wind_speed: float = Field(5, ge=0, description="Wind speed (m/s)")
    month: int = Field(6, ge=1, le=12, description="Month of growing season")
    growing_days: int = Field(100, ge=30, le=365, description="Length of growing season")
    soil_quality: float = Field(0.7, ge=0, le=1, description="Soil quality index (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "crop": "wheat",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "temp_avg": 22.5,
                "temp_min": 15.0,
                "temp_max": 30.0,
                "precipitation": 80,
                "humidity": 65,
                "solar_radiation": 20,
                "wind_speed": 5,
                "month": 7,
                "growing_days": 120,
                "soil_quality": 0.75
            }
        }


class RiskFactor(BaseModel):
    """Risk factor detail"""
    factor: str
    severity: float
    description: str
    impact: str


class PredictionResponse(BaseModel):
    """Response model for yield prediction"""
    success: bool
    crop: str
    predicted_yield: float
    yield_unit: str = "kg/hectare"
    confidence_interval: Dict[str, float]
    confidence_level: float
    risk_factors: List[RiskFactor]
    recommendations: List[str]
    model_metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    timestamp: str


class ModelInfoResponse(BaseModel):
    """Response model for model information"""
    model_name: str
    version: str
    architecture: List[str]
    is_trained: bool
    training_samples: int
    metrics: Optional[Dict]
    features_used: List[str]
    supported_crops: List[str]


class TrainingResponse(BaseModel):
    """Response model for training status"""
    success: bool
    message: str
    metrics: Optional[Dict]
    training_time_seconds: Optional[float]


class BatchPredictionRequest(BaseModel):
    """Request model for batch predictions"""
    predictions: List[PredictionRequest]


class BatchPredictionResponse(BaseModel):
    """Response model for batch predictions"""
    success: bool
    count: int
    results: List[PredictionResponse]


# ============ ENDPOINTS ============

@router.get("/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Get information about the ML model
    Returns model architecture, training status, and supported crops
    """
    from app.ml import YieldPredictor
    from app.ml.data_generator import CROP_PARAMETERS
    
    predictor = YieldPredictor()
    predictor.load()
    
    return ModelInfoResponse(
        model_name="AgroSim Yield Predictor",
        version="2.0.0",
        architecture=[
            "XGBoost (Gradient Boosting)",
            "Random Forest",
            "LightGBM",
            "Ridge Regression (Meta-Learner)",
            "Stacking Ensemble"
        ],
        is_trained=predictor.is_trained,
        training_samples=10000,
        metrics={
            "r2_score": predictor.training_metrics.r2_score if predictor.training_metrics else None,
            "rmse": predictor.training_metrics.rmse if predictor.training_metrics else None,
            "cv_mean": predictor.training_metrics.cv_mean if predictor.training_metrics else None,
        } if predictor.training_metrics else None,
        features_used=predictor.feature_names if predictor.feature_names else [],
        supported_crops=list(CROP_PARAMETERS.keys())
    )


@router.post("/train", response_model=TrainingResponse)
async def train_model(
    background_tasks: BackgroundTasks,
    n_samples: int = Query(10000, ge=1000, le=50000, description="Number of training samples (only for synthetic)"),
    use_real_data: bool = Query(True, description="Use real FAO yield data (RECOMMENDED for reliability)")
):
    """
    Train the ML model
    
    - use_real_data=True (default): Uses FAO STAT real yield data - RELIABLE predictions
    - use_real_data=False: Uses synthetic data - faster but less accurate
    """
    import time
    from app.ml import YieldPredictor, generate_training_data
    
    start_time = time.time()
    
    try:
        predictor = YieldPredictor()
        
        data_source = "FAO STAT (real global yields)" if use_real_data else "Synthetic data"
        
        # Train synchronously (real data is not huge)
        metrics = predictor.train(n_samples=n_samples, use_real_data=use_real_data)
        training_time = time.time() - start_time
        
        return TrainingResponse(
            success=True,
            message=f"Model trained successfully using {data_source}",
            metrics={
                "r2_score": metrics.r2_score,
                "rmse": metrics.rmse,
                "mae": metrics.mae,
                "mape": metrics.mape,
                "cv_mean": metrics.cv_mean,
                "cv_std": metrics.cv_std,
                "data_source": data_source  
            },
            training_time_seconds=round(training_time, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/predict", response_model=PredictionResponse)
async def predict_yield(request: PredictionRequest):
    """
    Predict crop yield based on environmental conditions
    Returns prediction with confidence interval and risk analysis
    """
    from app.ml import YieldPredictor
    from app.ml.data_generator import CROP_PARAMETERS
    
    # Validate crop
    if request.crop.lower() not in CROP_PARAMETERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop: {request.crop}. Supported crops: {list(CROP_PARAMETERS.keys())}"
        )
    
    try:
        predictor = YieldPredictor()
        
        # Ensure model is trained
        if not predictor.load():
            print("Training model for first time...")
            predictor.train(n_samples=5000)
        
        result = predictor.predict(
            crop=request.crop.lower(),
            temp_avg=request.temp_avg,
            temp_min=request.temp_min,
            temp_max=request.temp_max,
            precipitation=request.precipitation,
            humidity=request.humidity,
            solar_radiation=request.solar_radiation,
            latitude=request.latitude,
            longitude=request.longitude,
            month=request.month,
            growing_days=request.growing_days,
            soil_quality=request.soil_quality,
            wind_speed=request.wind_speed
        )
        
        return PredictionResponse(
            success=True,
            crop=result.crop,
            predicted_yield=result.predicted_yield,
            confidence_interval={
                "lower": result.confidence_lower,
                "upper": result.confidence_upper
            },
            confidence_level=result.confidence_level,
            risk_factors=[RiskFactor(**rf) for rf in result.risk_factors],
            recommendations=result.recommendations,
            model_metrics=result.model_metrics,
            feature_importance=result.feature_importance,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest):
    """
    Batch prediction for multiple scenarios
    Useful for comparing different crops or conditions
    """
    results = []
    
    for pred_request in request.predictions:
        try:
            result = await predict_yield(pred_request)
            results.append(result)
        except HTTPException as e:
            # Create error response for failed predictions
            results.append(PredictionResponse(
                success=False,
                crop=pred_request.crop,
                predicted_yield=0,
                confidence_interval={"lower": 0, "upper": 0},
                confidence_level=0,
                risk_factors=[],
                recommendations=[f"Prediction failed: {e.detail}"],
                model_metrics={},
                feature_importance={},
                timestamp=datetime.now().isoformat()
            ))
    
    return BatchPredictionResponse(
        success=True,
        count=len(results),
        results=results
    )


# ============ AUTO-WEATHER PREDICTION (REAL DATA) ============

class AutoWeatherPredictionRequest(BaseModel):
    """Request model for prediction with automatic weather data"""
    crop: str = Field(..., description="Crop type: wheat, corn, rice, soybean, potato, cotton, sugarcane")
    latitude: float = Field(..., ge=-90, le=90, description="Location latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Location longitude")
    month: int = Field(6, ge=1, le=12, description="Month of growing season")
    growing_days: int = Field(100, ge=30, le=365, description="Length of growing season")
    soil_quality: float = Field(0.7, ge=0, le=1, description="Soil quality index (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "crop": "wheat",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "month": 7,
                "growing_days": 120,
                "soil_quality": 0.75
            }
        }


class AutoWeatherPredictionResponse(PredictionResponse):
    """Response with auto-fetched weather data included"""
    weather_data: Dict[str, float]
    weather_source: str


@router.post("/predict/auto-weather", response_model=AutoWeatherPredictionResponse)
async def predict_with_auto_weather(request: AutoWeatherPredictionRequest):
    """
    Predict crop yield with AUTOMATIC weather data from NASA POWER
    
    Just provide crop and location - weather is fetched automatically!
    This uses REAL weather data making predictions more RELIABLE.
    """
    from app.ml import YieldPredictor
    from app.ml.data_generator import CROP_PARAMETERS
    from app.ml.real_data_fetcher import fetch_current_weather
    
    # Validate crop
    if request.crop.lower() not in CROP_PARAMETERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported crop: {request.crop}. Supported crops: {list(CROP_PARAMETERS.keys())}"
        )
    
    try:
        # Fetch real weather data from NASA POWER
        weather = fetch_current_weather(request.latitude, request.longitude, days_back=30)
        
        if weather.get("success"):
            temp_avg = weather.get("temp_avg", 20)
            temp_min = weather.get("temp_min", 10)
            temp_max = weather.get("temp_max", 30)
            precipitation = weather.get("total_precipitation", 100)
            humidity = weather.get("humidity", 60)
            solar_radiation = weather.get("solar_radiation", 20)
            wind_speed = weather.get("wind_speed", 5)
            weather_source = "NASA POWER API (Real Data)"
        else:
            # Fallback to climate estimates
            temp_avg = 28 - abs(request.latitude) * 0.4
            temp_min = temp_avg - 10
            temp_max = temp_avg + 10
            precipitation = 100
            humidity = 60
            solar_radiation = 20
            wind_speed = 5
            weather_source = "Climate Estimate (NASA POWER unavailable)"
        
        predictor = YieldPredictor()
        
        # Ensure model is trained
        if not predictor.load():
            print("Training model for first time with real data...")
            predictor.train(use_real_data=True)
        
        result = predictor.predict(
            crop=request.crop.lower(),
            temp_avg=temp_avg,
            temp_min=temp_min,
            temp_max=temp_max,
            precipitation=precipitation,
            humidity=humidity,
            solar_radiation=solar_radiation,
            latitude=request.latitude,
            longitude=request.longitude,
            month=request.month,
            growing_days=request.growing_days,
            soil_quality=request.soil_quality,
            wind_speed=wind_speed
        )
        
        return AutoWeatherPredictionResponse(
            success=True,
            crop=result.crop,
            predicted_yield=result.predicted_yield,
            confidence_interval={
                "lower": result.confidence_lower,
                "upper": result.confidence_upper
            },
            confidence_level=result.confidence_level,
            risk_factors=[RiskFactor(**rf) for rf in result.risk_factors],
            recommendations=result.recommendations,
            model_metrics=result.model_metrics,
            feature_importance=result.feature_importance,
            timestamp=datetime.now().isoformat(),
            weather_data={
                "temp_avg": round(temp_avg, 1),
                "temp_min": round(temp_min, 1),
                "temp_max": round(temp_max, 1),
                "precipitation": round(precipitation, 1),
                "humidity": round(humidity, 1),
                "solar_radiation": round(solar_radiation, 1),
                "wind_speed": round(wind_speed, 1)
            },
            weather_source=weather_source
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("/feature-importance")
async def get_feature_importance():
    """
    Get feature importance ranking from the trained model
    Shows which factors most influence yield predictions
    """
    from app.ml import YieldPredictor
    
    predictor = YieldPredictor()
    if not predictor.load():
        raise HTTPException(status_code=404, detail="Model not trained. Call /train first.")
    
    importance = predictor._get_feature_importance()
    display_names = predictor.feature_engineer.get_feature_importance_names()
    
    # Create human-readable importance list
    readable_importance = []
    for i, (feature, value) in enumerate(importance.items()):
        readable_importance.append({
            "rank": i + 1,
            "feature": feature,
            "display_name": display_names[i] if i < len(display_names) else feature,
            "importance": round(value * 100, 2),
            "importance_pct": f"{round(value * 100, 2)}%"
        })
    
    return {
        "success": True,
        "features": readable_importance,
        "total_features": len(importance),
        "model_type": "Ensemble (XGBoost + RandomForest + LightGBM)"
    }


@router.get("/crop-suitability/{crop}")
async def get_crop_suitability(
    crop: str,
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    temp_avg: float = Query(20, description="Average temperature"),
    precipitation: float = Query(100, description="Monthly precipitation")
):
    """
    Check suitability of a crop for given conditions
    Returns optimal vs actual conditions comparison
    """
    from app.ml.data_generator import CROP_PARAMETERS
    
    crop = crop.lower()
    if crop not in CROP_PARAMETERS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unknown crop. Available: {list(CROP_PARAMETERS.keys())}"
        )
    
    params = CROP_PARAMETERS[crop]
    
    # Calculate suitability scores
    opt_temp = (params["optimal_temp"][0] + params["optimal_temp"][1]) / 2
    temp_score = max(0, 1 - abs(temp_avg - opt_temp) / 20)
    
    opt_water = (params["water_need"][0] + params["water_need"][1]) / 2 / 4
    water_score = max(0, 1 - abs(precipitation - opt_water) / opt_water)
    
    overall_score = (temp_score * 0.6 + water_score * 0.4)
    
    suitability = "Excellent" if overall_score > 0.8 else \
                  "Good" if overall_score > 0.6 else \
                  "Moderate" if overall_score > 0.4 else \
                  "Poor" if overall_score > 0.2 else "Not Recommended"
    
    return {
        "crop": crop,
        "suitability_score": round(overall_score, 2),
        "suitability_rating": suitability,
        "optimal_conditions": {
            "temperature": f"{params['optimal_temp'][0]}-{params['optimal_temp'][1]}°C",
            "precipitation": f"{params['water_need'][0]}-{params['water_need'][1]} mm/season",
            "frost_tolerance": f"{params['frost_tolerance']}°C",
            "heat_tolerance": f"{params['heat_tolerance']}°C"
        },
        "current_conditions": {
            "temperature": f"{temp_avg}°C",
            "precipitation": f"{precipitation} mm/month"
        },
        "scores": {
            "temperature": round(temp_score, 2),
            "water": round(water_score, 2)
        },
        "recommendations": [
            f"Optimal temperature for {crop}: {opt_temp:.1f}°C (you have {temp_avg}°C)",
            f"Optimal monthly water: {opt_water:.0f}mm (you have {precipitation}mm)"
        ] if overall_score < 0.8 else ["Conditions are suitable for this crop"]
    }


@router.get("/compare-crops")
async def compare_crops(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    temp_avg: float = Query(20),
    precipitation: float = Query(100)
):
    """
    Compare all supported crops for given conditions
    Returns ranked list of suitable crops
    """
    from app.ml.data_generator import CROP_PARAMETERS
    
    results = []
    
    for crop in CROP_PARAMETERS.keys():
        suitability = await get_crop_suitability(
            crop=crop,
            latitude=latitude,
            longitude=longitude,
            temp_avg=temp_avg,
            precipitation=precipitation
        )
        results.append({
            "crop": crop,
            "score": suitability["suitability_score"],
            "rating": suitability["suitability_rating"]
        })
    
    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "location": {"latitude": latitude, "longitude": longitude},
        "conditions": {"temperature": temp_avg, "precipitation": precipitation},
        "rankings": results,
        "best_crop": results[0]["crop"] if results else None
    }
