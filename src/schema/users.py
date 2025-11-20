# --- Pydantic Models ---
from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    name: str
    preferences: list[str] = []
    allergies: list[str] = []

class ResumeRequest(BaseModel):
    choice: int  # 1, 2, or 3