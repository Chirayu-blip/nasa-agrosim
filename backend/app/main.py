"""
AgroSim - NASA Agricultural Simulation Game
Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import game, nasa_data, crops, weather, auth, leaderboard
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize database on startup"""
    init_db()
    yield


app = FastAPI(
    title="AgroSim API",
    description="NASA Agricultural Simulation Game Backend",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(nasa_data.router, prefix="/api/nasa", tags=["NASA Data"])
app.include_router(crops.router, prefix="/api/crops", tags=["Crops"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to AgroSim API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
