"""
Database Configuration
SQLite database with SQLAlchemy ORM
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - SQLite for development, can switch to PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agrosim.db")

# For SQLite, we need connect_args to allow multi-threading
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize the database - create all tables"""
    from app.models.database_models import User, GameSession, LeaderboardEntry
    Base.metadata.create_all(bind=engine)
