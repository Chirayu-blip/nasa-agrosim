"""
Database Models
SQLAlchemy ORM models for persistent storage
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    """User account model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100))
    avatar_url = Column(String(255), default="/avatars/default.png")
    
    # Stats
    total_games_played = Column(Integer, default=0)
    total_crops_harvested = Column(Integer, default=0)
    total_revenue_earned = Column(Float, default=0.0)
    highest_score = Column(Integer, default=0)
    
    # Account info
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    game_sessions = relationship("GameSession", back_populates="user")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="user")


class GameSession(Base):
    """Saved game sessions for persistence"""
    __tablename__ = "game_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Game state
    player_name = Column(String(100))
    difficulty = Column(String(20))
    latitude = Column(Float)
    longitude = Column(Float)
    current_day = Column(Integer, default=1)
    season = Column(String(20), default="spring")
    budget = Column(Float, default=5000.0)
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    
    # Serialized game data
    plots_data = Column(JSON)  # Store plots as JSON
    achievements = Column(JSON, default=[])
    weather_history = Column(JSON, default=[])
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="game_sessions")


class LeaderboardEntry(Base):
    """Leaderboard entries for competitive play"""
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Score info
    score = Column(Integer, nullable=False, index=True)
    total_revenue = Column(Float, default=0.0)
    crops_harvested = Column(Integer, default=0)
    days_played = Column(Integer, default=0)
    difficulty = Column(String(20), default="normal")
    
    # Location info (for location-based leaderboards)
    latitude = Column(Float)
    longitude = Column(Float)
    region = Column(String(100))
    
    # Timestamps
    achieved_at = Column(DateTime, default=datetime.utcnow)
    season = Column(String(20))  # Could track seasonal leaderboards
    
    # Relationships
    user = relationship("User", back_populates="leaderboard_entries")


class Achievement(Base):
    """Achievement definitions and tracking"""
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255))
    icon = Column(String(50))
    points = Column(Integer, default=10)
    category = Column(String(50))  # farming, weather, economy, etc.
    
    # Requirements (JSON for flexibility)
    requirements = Column(JSON)


class UserAchievement(Base):
    """Track which achievements users have earned"""
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    game_session_id = Column(Integer, ForeignKey("game_sessions.id"))
