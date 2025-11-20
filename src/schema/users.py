# --- Pydantic Models ---
from pydantic import BaseModel
from typing import Dict, Any


class UserProfile(BaseModel):
    id: str
    name: str
    preferences: list[str] = []
    allergies: list[str] = []
    schedule: Dict[str, Any] = {}
    special_instructions: str = ""

class ResumeRequest(BaseModel):
    choice: int  # 1, 2, or 3