"""
Game API Routes
Core game mechanics and state management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import uuid
import httpx
import random

router = APIRouter()

# Crop temperature requirements (optimal temp, min, max)
CROP_TEMPS = {
    "wheat": {"optimal": 18, "min": 5, "max": 30},
    "corn": {"optimal": 25, "min": 15, "max": 35},
    "rice": {"optimal": 28, "min": 20, "max": 38},
    "potato": {"optimal": 15, "min": 5, "max": 25},
    "tomato": {"optimal": 22, "min": 12, "max": 32},
    "soybean": {"optimal": 24, "min": 15, "max": 35},
}


# ============ MODELS ============

class GameDifficulty(str, Enum):
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"


class PlotStatus(str, Enum):
    EMPTY = "empty"
    PLANTED = "planted"
    GROWING = "growing"
    READY = "ready"
    HARVESTED = "harvested"


class FarmPlot(BaseModel):
    id: str
    status: PlotStatus
    crop_id: Optional[str] = None
    planted_day: Optional[int] = None
    water_level: float = 50.0  # 0-100
    fertilizer_level: float = 0.0  # 0-100
    health: float = 100.0  # 0-100
    growth_progress: float = 0.0  # 0-100


class GameState(BaseModel):
    id: str
    player_name: str
    difficulty: GameDifficulty
    location: Dict[str, float]  # lat, lon
    current_day: int
    season: str
    budget: float
    total_revenue: float
    total_expenses: float
    plots: List[FarmPlot]
    weather_today: Dict
    achievements: List[str]
    created_at: str


class CreateGameRequest(BaseModel):
    player_name: str
    difficulty: GameDifficulty = GameDifficulty.NORMAL
    latitude: float
    longitude: float
    num_plots: int = 6


class GameAction(BaseModel):
    action: str  # plant, water, fertilize, harvest
    plot_id: str
    crop_id: Optional[str] = None
    amount: Optional[float] = None


# ============ IN-MEMORY STORAGE ============
# In production, use a database

games_db: Dict[str, GameState] = {}


# ============ GAME CONSTANTS ============

DIFFICULTY_SETTINGS = {
    GameDifficulty.EASY: {
        "starting_budget": 10000,
        "weather_severity": 0.5,
        "growth_speed": 1.2
    },
    GameDifficulty.NORMAL: {
        "starting_budget": 5000,
        "weather_severity": 1.0,
        "growth_speed": 1.0
    },
    GameDifficulty.HARD: {
        "starting_budget": 2500,
        "weather_severity": 1.5,
        "growth_speed": 0.8
    }
}

ACTION_COSTS = {
    "water": 10,
    "fertilize": 50,
    "plant": 100,  # Base cost, varies by crop
}

SEASONS = ["spring", "summer", "fall", "winter"]


# ============ WEATHER HELPERS ============

async def fetch_location_weather(latitude: float, longitude: float) -> Dict:
    """Fetch real weather data from NASA POWER API based on location"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        params = {
            "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M",
            "community": "AG",
            "longitude": longitude,
            "latitude": latitude,
            "start": start_date.strftime("%Y%m%d"),
            "end": end_date.strftime("%Y%m%d"),
            "format": "JSON"
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                props = data.get("properties", {}).get("parameter", {})
                
                # Get most recent day's data
                temps = list(props.get("T2M", {}).values())
                precip = list(props.get("PRECTOTCORR", {}).values())
                humidity = list(props.get("RH2M", {}).values())
                
                # Filter out -999 (missing data)
                temps = [t for t in temps if t > -900]
                precip = [p for p in precip if p > -900]
                humidity = [h for h in humidity if h > -900]
                
                avg_temp = round(sum(temps) / len(temps), 1) if temps else 22
                avg_precip = round(sum(precip) / len(precip), 1) if precip else 5
                avg_humidity = round(sum(humidity) / len(humidity), 1) if humidity else 60
                
                # Determine conditions based on data
                if avg_precip > 10:
                    conditions = "Rainy"
                    icon = "🌧️"
                elif avg_temp > 35:
                    conditions = "Hot"
                    icon = "🔥"
                elif avg_temp < 5:
                    conditions = "Cold"
                    icon = "❄️"
                elif avg_precip > 3:
                    conditions = "Cloudy"
                    icon = "☁️"
                else:
                    conditions = "Clear"
                    icon = "☀️"
                
                return {
                    "temperature": avg_temp,
                    "precipitation": avg_precip,
                    "humidity": avg_humidity,
                    "conditions": conditions,
                    "icon": icon,
                    "source": "NASA POWER API"
                }
    except Exception as e:
        print(f"Failed to fetch NASA weather: {e}")
    
    # Fallback to location-based estimates
    return get_estimated_weather(latitude, longitude)


def get_estimated_weather(latitude: float, longitude: float) -> Dict:
    """Estimate weather based on latitude (climate zones)"""
    abs_lat = abs(latitude)
    
    # Temperature varies by latitude (tropical to polar)
    if abs_lat < 23.5:  # Tropical
        base_temp = 28 + random.uniform(-3, 3)
        precip = 8 + random.uniform(0, 10)
        conditions = "Tropical"
        icon = "🌴"
    elif abs_lat < 35:  # Subtropical
        base_temp = 24 + random.uniform(-4, 4)
        precip = 5 + random.uniform(0, 8)
        conditions = "Warm"
        icon = "☀️"
    elif abs_lat < 55:  # Temperate
        base_temp = 15 + random.uniform(-6, 6)
        precip = 4 + random.uniform(0, 6)
        conditions = "Temperate"
        icon = "🌤️"
    else:  # Polar/Subarctic
        base_temp = 2 + random.uniform(-10, 5)
        precip = 2 + random.uniform(0, 3)
        conditions = "Cold"
        icon = "❄️"
    
    # Adjust for season (Northern vs Southern hemisphere)
    month = datetime.now().month
    is_winter = (latitude > 0 and month in [12, 1, 2]) or (latitude < 0 and month in [6, 7, 8])
    if is_winter:
        base_temp -= 10
    
    return {
        "temperature": round(base_temp, 1),
        "precipitation": round(precip, 1),
        "humidity": round(60 + random.uniform(-20, 20), 1),
        "conditions": conditions,
        "icon": icon,
        "source": "Estimated from location"
    }


def calculate_temperature_effect(crop_id: str, temperature: float) -> float:
    """Calculate how temperature affects crop growth (0.0 to 1.5 multiplier)"""
    crop_temp = CROP_TEMPS.get(crop_id, {"optimal": 22, "min": 10, "max": 35})
    
    optimal = crop_temp["optimal"]
    min_temp = crop_temp["min"]
    max_temp = crop_temp["max"]
    
    # Outside viable range - severe penalty
    if temperature < min_temp or temperature > max_temp:
        return 0.2  # 80% growth reduction
    
    # Calculate how close to optimal
    if temperature <= optimal:
        # Linearly scale from min to optimal
        range_size = optimal - min_temp
        distance = optimal - temperature
        score = 1.0 - (distance / range_size) * 0.5  # 0.5 to 1.0
    else:
        # Linearly scale from optimal to max
        range_size = max_temp - optimal
        distance = temperature - optimal
        score = 1.0 - (distance / range_size) * 0.5  # 0.5 to 1.0
    
    # Bonus for near-optimal temperature
    if abs(temperature - optimal) <= 3:
        score = min(1.5, score * 1.2)  # Up to 20% bonus
    
    return round(max(0.2, min(1.5, score)), 2)


# ============ ROUTES ============

@router.post("/new", response_model=GameState)
async def create_new_game(request: CreateGameRequest):
    """Create a new game session"""
    
    game_id = str(uuid.uuid4())[:8]
    settings = DIFFICULTY_SETTINGS[request.difficulty]
    
    # Fetch real weather data for the selected location
    weather_data = await fetch_location_weather(request.latitude, request.longitude)
    
    # Create farm plots
    plots = []
    for i in range(request.num_plots):
        plots.append(FarmPlot(
            id=f"plot_{i+1}",
            status=PlotStatus.EMPTY
        ))
    
    game = GameState(
        id=game_id,
        player_name=request.player_name,
        difficulty=request.difficulty,
        location={
            "latitude": request.latitude,
            "longitude": request.longitude
        },
        current_day=1,
        season="spring",
        budget=settings["starting_budget"],
        total_revenue=0,
        total_expenses=0,
        plots=plots,
        weather_today=weather_data,
        achievements=[],
        created_at=datetime.now().isoformat()
    )
    
    games_db[game_id] = game
    
    return game


@router.get("/{game_id}", response_model=GameState)
async def get_game_state(game_id: str):
    """Get current game state"""
    
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return games_db[game_id]


@router.post("/{game_id}/action")
async def perform_action(game_id: str, action: GameAction):
    """Perform a game action (plant, water, fertilize, harvest)"""
    
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    
    # Find the plot
    plot = None
    for p in game.plots:
        if p.id == action.plot_id:
            plot = p
            break
    
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    result = {"success": False, "message": "", "cost": 0, "revenue": 0}
    
    if action.action == "plant":
        if plot.status != PlotStatus.EMPTY:
            result["message"] = "Plot is not empty"
        elif not action.crop_id:
            result["message"] = "No crop specified"
        elif game.budget < ACTION_COSTS["plant"]:
            result["message"] = "Insufficient funds"
        else:
            plot.status = PlotStatus.PLANTED
            plot.crop_id = action.crop_id
            plot.planted_day = game.current_day
            plot.growth_progress = 0
            plot.health = 100
            
            cost = ACTION_COSTS["plant"]
            game.budget -= cost
            game.total_expenses += cost
            
            result["success"] = True
            result["message"] = f"Planted {action.crop_id}"
            result["cost"] = cost
    
    elif action.action == "water":
        if plot.status == PlotStatus.EMPTY:
            result["message"] = "Cannot water empty plot"
        elif game.budget < ACTION_COSTS["water"]:
            result["message"] = "Insufficient funds"
        else:
            water_amount = action.amount or 25
            plot.water_level = min(100, plot.water_level + water_amount)
            
            cost = ACTION_COSTS["water"]
            game.budget -= cost
            game.total_expenses += cost
            
            result["success"] = True
            result["message"] = f"Watered plot. Water level: {plot.water_level}%"
            result["cost"] = cost
    
    elif action.action == "fertilize":
        if plot.status == PlotStatus.EMPTY:
            result["message"] = "Cannot fertilize empty plot"
        elif game.budget < ACTION_COSTS["fertilize"]:
            result["message"] = "Insufficient funds"
        else:
            fert_amount = action.amount or 30
            plot.fertilizer_level = min(100, plot.fertilizer_level + fert_amount)
            
            cost = ACTION_COSTS["fertilize"]
            game.budget -= cost
            game.total_expenses += cost
            
            result["success"] = True
            result["message"] = f"Fertilized plot. Fertilizer level: {plot.fertilizer_level}%"
            result["cost"] = cost
    
    elif action.action == "harvest":
        if plot.status != PlotStatus.READY:
            result["message"] = "Crop is not ready for harvest"
        else:
            # Calculate revenue based on health
            base_revenue = 500  # Would vary by crop
            health_modifier = plot.health / 100
            revenue = base_revenue * health_modifier
            
            game.budget += revenue
            game.total_revenue += revenue
            
            plot.status = PlotStatus.EMPTY
            plot.crop_id = None
            plot.planted_day = None
            plot.growth_progress = 0
            plot.water_level = 50
            plot.fertilizer_level = 0
            
            result["success"] = True
            result["message"] = f"Harvested! Earned ${revenue:.2f}"
            result["revenue"] = revenue
    
    else:
        result["message"] = f"Unknown action: {action.action}"
    
    return result


@router.post("/{game_id}/advance-day")
async def advance_day(game_id: str):
    """Advance the game by one day"""
    
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    settings = DIFFICULTY_SETTINGS[game.difficulty]
    
    events = []
    
    # Update weather based on location (with daily variation)
    lat = game.location.get("latitude", 28.6)
    lon = game.location.get("longitude", 77.2)
    new_weather = get_estimated_weather(lat, lon)
    
    # Add some daily variation to temperature
    temp_variation = random.uniform(-3, 3)
    new_weather["temperature"] = round(new_weather["temperature"] + temp_variation, 1)
    game.weather_today = new_weather
    
    current_temp = new_weather["temperature"]
    current_precip = new_weather.get("precipitation", 5)
    
    # Weather events
    if current_temp > 38:
        events.append(f"🔥 HEATWAVE! Temperature: {current_temp}°C - Crops are stressed!")
    elif current_temp < 2:
        events.append(f"❄️ FROST WARNING! Temperature: {current_temp}°C - Crops may be damaged!")
    elif current_precip > 15:
        events.append(f"🌧️ HEAVY RAIN! Precipitation: {current_precip}mm - No need to water today!")
    
    # Update each plot
    for plot in game.plots:
        if plot.status in [PlotStatus.PLANTED, PlotStatus.GROWING]:
            # Decrease water level (less if raining)
            water_loss = 10 if current_precip < 5 else 5 if current_precip < 10 else 0
            plot.water_level = max(0, plot.water_level - water_loss)
            
            # Rain adds water
            if current_precip > 5:
                rain_water = min(30, current_precip * 2)
                plot.water_level = min(100, plot.water_level + rain_water)
            
            # Health affected by water
            if plot.water_level < 20:
                plot.health = max(0, plot.health - 5)
                events.append(f"{plot.id}: Low water! Health declining.")
            
            # Health affected by extreme temperature
            if current_temp > 38 or current_temp < 2:
                damage = 10 * settings["weather_severity"]
                plot.health = max(0, plot.health - damage)
            
            # Growth progress - base rate
            growth_rate = 5 * settings["growth_speed"]
            
            # TEMPERATURE EFFECT ON GROWTH
            if plot.crop_id:
                temp_modifier = calculate_temperature_effect(plot.crop_id, current_temp)
                growth_rate *= temp_modifier
                
                # Notify player about temperature impact
                if temp_modifier < 0.5:
                    events.append(f"{plot.id}: {plot.crop_id} struggling at {current_temp}°C (sub-optimal temperature)")
                elif temp_modifier > 1.2:
                    events.append(f"{plot.id}: {plot.crop_id} thriving at {current_temp}°C! 🌱")
            
            # Fertilizer bonus
            if plot.fertilizer_level > 50:
                growth_rate *= 1.3
            
            # Water penalty
            if plot.water_level < 30:
                growth_rate *= 0.5
            
            plot.growth_progress = min(100, plot.growth_progress + growth_rate)
            plot.fertilizer_level = max(0, plot.fertilizer_level - 2)
            
            # Update status
            if plot.growth_progress >= 100:
                plot.status = PlotStatus.READY
                events.append(f"{plot.id}: 🌾 Crop is ready to harvest!")
            elif plot.growth_progress > 0:
                plot.status = PlotStatus.GROWING
    
    # Advance day and season
    game.current_day += 1
    
    # Season changes every 30 days
    season_index = ((game.current_day - 1) // 30) % 4
    game.season = SEASONS[season_index]
    
    # Check for achievements
    if game.total_revenue >= 1000 and "First $1000" not in game.achievements:
        game.achievements.append("First $1000")
        events.append("🏆 Achievement unlocked: First $1000!")
    
    if game.current_day >= 30 and "Survived a Month" not in game.achievements:
        game.achievements.append("Survived a Month")
        events.append("🏆 Achievement unlocked: Survived a Month!")
    
    return {
        "current_day": game.current_day,
        "season": game.season,
        "budget": game.budget,
        "weather": game.weather_today,
        "events": events,
        "plots": game.plots
    }


@router.get("/{game_id}/summary")
async def get_game_summary(game_id: str):
    """Get game summary and statistics"""
    
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = games_db[game_id]
    
    # Calculate stats
    active_plots = sum(1 for p in game.plots if p.status != PlotStatus.EMPTY)
    ready_plots = sum(1 for p in game.plots if p.status == PlotStatus.READY)
    avg_health = sum(p.health for p in game.plots) / len(game.plots) if game.plots else 0
    
    return {
        "game_id": game.id,
        "player_name": game.player_name,
        "days_played": game.current_day,
        "season": game.season,
        "financial": {
            "current_budget": round(game.budget, 2),
            "total_revenue": round(game.total_revenue, 2),
            "total_expenses": round(game.total_expenses, 2),
            "profit": round(game.total_revenue - game.total_expenses, 2)
        },
        "farm": {
            "total_plots": len(game.plots),
            "active_plots": active_plots,
            "ready_to_harvest": ready_plots,
            "average_health": round(avg_health, 1)
        },
        "achievements": game.achievements
    }


@router.delete("/{game_id}")
async def delete_game(game_id: str):
    """Delete a game session"""
    
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Game not found")
    
    del games_db[game_id]
    
    return {"message": "Game deleted successfully"}
