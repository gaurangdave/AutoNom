# --- Pydantic Models ---
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class UserProfile(BaseModel):
    id: str
    name: str
    preferences: list[str] = []
    allergies: list[str] = []
    schedule: Dict[str, Any] = {}
    special_instructions: str = ""


class Session(BaseModel):
    app_name: str
    user_id: str
    id: str
    state: Dict[str, Any]
    create_time: datetime
    update_time: datetime


class ResumeRequest(BaseModel):
    choice: int  # 1, 2, or 3