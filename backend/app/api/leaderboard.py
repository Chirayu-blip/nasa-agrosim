"""
Leaderboard API Routes
Global and regional leaderboards with score tracking
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.models.database_models import User, LeaderboardEntry
from app.api.auth import get_current_user, get_current_user_required

router = APIRouter()


# ============ MODELS ============

class LeaderboardEntryCreate(BaseModel):
    score: int
    total_revenue: float
    crops_harvested: int
    days_played: int
    difficulty: str = "normal"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    region: Optional[str] = None


class LeaderboardEntryResponse(BaseModel):
    id: int
    rank: int
    username: str
    display_name: str
    avatar_url: str
    score: int
    total_revenue: float
    crops_harvested: int
    days_played: int
    difficulty: str
    region: Optional[str]
    achieved_at: datetime
    
    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntryResponse]
    total_players: int
    user_rank: Optional[int] = None
    user_entry: Optional[LeaderboardEntryResponse] = None


class UserStatsResponse(BaseModel):
    username: str
    display_name: str
    total_games_played: int
    total_crops_harvested: int
    total_revenue_earned: float
    highest_score: int
    rank: int
    recent_scores: List[int]


# ============ HELPER FUNCTIONS ============

def calculate_score(total_revenue: float, crops_harvested: int, days_played: int, difficulty: str) -> int:
    """Calculate score based on game performance"""
    difficulty_multiplier = {
        "easy": 0.5,
        "normal": 1.0,
        "hard": 1.5
    }.get(difficulty, 1.0)
    
    # Base score from revenue
    revenue_score = int(total_revenue / 10)
    
    # Bonus for crops harvested
    crop_bonus = crops_harvested * 50
    
    # Efficiency bonus (revenue per day)
    efficiency_bonus = int((total_revenue / max(days_played, 1)) * 10)
    
    # Calculate final score
    base_score = revenue_score + crop_bonus + efficiency_bonus
    final_score = int(base_score * difficulty_multiplier)
    
    return max(final_score, 0)


def get_user_rank(db: Session, user_id: int) -> Optional[int]:
    """Get user's global rank based on highest score"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    rank = db.query(func.count(User.id)).filter(
        User.highest_score > user.highest_score
    ).scalar()
    
    return rank + 1 if rank is not None else None


# ============ ROUTES ============

@router.post("/submit", response_model=LeaderboardEntryResponse)
async def submit_score(
    entry_data: LeaderboardEntryCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Submit a score to the leaderboard"""
    # Calculate score if not provided or verify it
    calculated_score = calculate_score(
        entry_data.total_revenue,
        entry_data.crops_harvested,
        entry_data.days_played,
        entry_data.difficulty
    )
    
    # Use the calculated score (prevents cheating)
    final_score = calculated_score
    
    # Create leaderboard entry
    db_entry = LeaderboardEntry(
        user_id=current_user.id,
        score=final_score,
        total_revenue=entry_data.total_revenue,
        crops_harvested=entry_data.crops_harvested,
        days_played=entry_data.days_played,
        difficulty=entry_data.difficulty,
        latitude=entry_data.latitude,
        longitude=entry_data.longitude,
        region=entry_data.region,
        achieved_at=datetime.utcnow()
    )
    
    db.add(db_entry)
    
    # Update user stats
    current_user.total_games_played += 1
    current_user.total_crops_harvested += entry_data.crops_harvested
    current_user.total_revenue_earned += entry_data.total_revenue
    if final_score > current_user.highest_score:
        current_user.highest_score = final_score
    
    db.commit()
    db.refresh(db_entry)
    
    # Get rank
    rank = db.query(func.count(LeaderboardEntry.id)).filter(
        LeaderboardEntry.score > final_score
    ).scalar() + 1
    
    return LeaderboardEntryResponse(
        id=db_entry.id,
        rank=rank,
        username=current_user.username,
        display_name=current_user.display_name or current_user.username,
        avatar_url=current_user.avatar_url,
        score=db_entry.score,
        total_revenue=db_entry.total_revenue,
        crops_harvested=db_entry.crops_harvested,
        days_played=db_entry.days_played,
        difficulty=db_entry.difficulty,
        region=db_entry.region,
        achieved_at=db_entry.achieved_at
    )


@router.get("/global", response_model=LeaderboardResponse)
async def get_global_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    difficulty: Optional[str] = None,
    timeframe: Optional[str] = None,  # "daily", "weekly", "monthly", "all"
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get global leaderboard"""
    query = db.query(LeaderboardEntry)
    
    # Filter by difficulty
    if difficulty:
        query = query.filter(LeaderboardEntry.difficulty == difficulty)
    
    # Filter by timeframe
    if timeframe:
        now = datetime.utcnow()
        if timeframe == "daily":
            query = query.filter(LeaderboardEntry.achieved_at >= now - timedelta(days=1))
        elif timeframe == "weekly":
            query = query.filter(LeaderboardEntry.achieved_at >= now - timedelta(weeks=1))
        elif timeframe == "monthly":
            query = query.filter(LeaderboardEntry.achieved_at >= now - timedelta(days=30))
    
    # Get total count
    total_players = query.count()
    
    # Get entries ordered by score
    entries = query.order_by(desc(LeaderboardEntry.score)).offset(offset).limit(limit).all()
    
    # Build response with ranks
    response_entries = []
    for idx, entry in enumerate(entries):
        user = db.query(User).filter(User.id == entry.user_id).first()
        response_entries.append(LeaderboardEntryResponse(
            id=entry.id,
            rank=offset + idx + 1,
            username=user.username if user else "Unknown",
            display_name=user.display_name if user else "Unknown",
            avatar_url=user.avatar_url if user else "/avatars/default.png",
            score=entry.score,
            total_revenue=entry.total_revenue,
            crops_harvested=entry.crops_harvested,
            days_played=entry.days_played,
            difficulty=entry.difficulty,
            region=entry.region,
            achieved_at=entry.achieved_at
        ))
    
    # Get current user's rank if logged in
    user_rank = None
    user_entry = None
    if current_user:
        user_rank = get_user_rank(db, current_user.id)
        user_best = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.user_id == current_user.id
        ).order_by(desc(LeaderboardEntry.score)).first()
        
        if user_best:
            user_entry = LeaderboardEntryResponse(
                id=user_best.id,
                rank=user_rank or 0,
                username=current_user.username,
                display_name=current_user.display_name or current_user.username,
                avatar_url=current_user.avatar_url,
                score=user_best.score,
                total_revenue=user_best.total_revenue,
                crops_harvested=user_best.crops_harvested,
                days_played=user_best.days_played,
                difficulty=user_best.difficulty,
                region=user_best.region,
                achieved_at=user_best.achieved_at
            )
    
    return LeaderboardResponse(
        entries=response_entries,
        total_players=total_players,
        user_rank=user_rank,
        user_entry=user_entry
    )


@router.get("/regional/{region}", response_model=LeaderboardResponse)
async def get_regional_leaderboard(
    region: str,
    limit: int = Query(10, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leaderboard for a specific region"""
    query = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.region == region
    ).order_by(desc(LeaderboardEntry.score))
    
    total_players = query.count()
    entries = query.limit(limit).all()
    
    response_entries = []
    for idx, entry in enumerate(entries):
        user = db.query(User).filter(User.id == entry.user_id).first()
        response_entries.append(LeaderboardEntryResponse(
            id=entry.id,
            rank=idx + 1,
            username=user.username if user else "Unknown",
            display_name=user.display_name if user else "Unknown",
            avatar_url=user.avatar_url if user else "/avatars/default.png",
            score=entry.score,
            total_revenue=entry.total_revenue,
            crops_harvested=entry.crops_harvested,
            days_played=entry.days_played,
            difficulty=entry.difficulty,
            region=entry.region,
            achieved_at=entry.achieved_at
        ))
    
    return LeaderboardResponse(
        entries=response_entries,
        total_players=total_players
    )


@router.get("/user/{username}", response_model=UserStatsResponse)
async def get_user_stats(
    username: str,
    db: Session = Depends(get_db)
):
    """Get stats for a specific user"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get recent scores
    recent = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.user_id == user.id
    ).order_by(desc(LeaderboardEntry.achieved_at)).limit(5).all()
    
    recent_scores = [entry.score for entry in recent]
    
    # Get rank
    rank = get_user_rank(db, user.id) or 0
    
    return UserStatsResponse(
        username=user.username,
        display_name=user.display_name or user.username,
        total_games_played=user.total_games_played,
        total_crops_harvested=user.total_crops_harvested,
        total_revenue_earned=user.total_revenue_earned,
        highest_score=user.highest_score,
        rank=rank,
        recent_scores=recent_scores
    )


@router.get("/my-scores")
async def get_my_scores(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Get current user's score history"""
    entries = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.user_id == current_user.id
    ).order_by(desc(LeaderboardEntry.achieved_at)).limit(limit).all()
    
    return {
        "scores": [
            {
                "id": entry.id,
                "score": entry.score,
                "total_revenue": entry.total_revenue,
                "crops_harvested": entry.crops_harvested,
                "days_played": entry.days_played,
                "difficulty": entry.difficulty,
                "achieved_at": entry.achieved_at.isoformat()
            }
            for entry in entries
        ],
        "highest_score": current_user.highest_score,
        "total_games": current_user.total_games_played
    }
