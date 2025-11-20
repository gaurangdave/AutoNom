import sqlite3
import json
from pathlib import Path
from typing import Any, Optional, Dict, List
from src.utils.logger import DatabaseLogger
from src.schema.users import UserProfile

CURRENT_DIR = Path(__file__).parent
DB_PATH = CURRENT_DIR / "data/autonom.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        # Users Table - UPDATED with 'schedule' and 'special_instructions' columns
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            preferences TEXT, -- JSON string
            allergies TEXT,   -- JSON string
            schedule TEXT,    -- JSON string (Stores days and meal slots)
            special_instructions TEXT, -- Text instructions from user
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
        # Add special_instructions column if it doesn't exist (for existing databases)
        try:
            conn.execute("ALTER TABLE users ADD COLUMN special_instructions TEXT")
        except sqlite3.OperationalError:
            # Column already exists, ignore the error
            pass
        # Sessions Table
        # let the ADK create session and other related tables
        # conn.execute("""
        # CREATE TABLE IF NOT EXISTS sessions (
        #     id TEXT PRIMARY KEY,
        #     user_id TEXT,
        #     meal_type TEXT,
        #     status TEXT,
        #     current_options TEXT,
        #     chosen_option TEXT,
        #     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        # );
        # """)
        # Orders Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            meal_details TEXT,
            status TEXT
        );
        """)
        
        DatabaseLogger.database_initialized(str(DB_PATH))

# --- User Helpers ---


def upsert_user(user_profile: UserProfile) -> None:
    """
    Creates or updates a user profile using UserProfile Pydantic model.
    """
    try:
        with get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO users (id, name, preferences, allergies, schedule, special_instructions) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    user_profile.id,
                    user_profile.name,
                    json.dumps(user_profile.preferences),
                    json.dumps(user_profile.allergies),
                    json.dumps(user_profile.schedule),
                    user_profile.special_instructions
                )
            )
            DatabaseLogger.user_saved(user_profile.name, user_profile.id)
    except Exception as e:
        DatabaseLogger.user_save_error(user_profile.name, str(e))
        raise


def upsert_user_legacy(user_id: str, name: str, preferences: Any, allergies: Any, schedule: Any, special_instructions: str = "") -> None:
    """
    Legacy function for backwards compatibility. Creates or updates a user profile.
    Consider migrating to upsert_user() which uses UserProfile Pydantic model.
    """
    user_profile = UserProfile(
        id=user_id,
        name=name,
        preferences=preferences,
        allergies=allergies,
        schedule=schedule,
        special_instructions=special_instructions
    )
    upsert_user(user_profile)


def get_all_users() -> List[UserProfile]:
    try:
        with get_connection() as conn:
            rows = conn.execute("SELECT * FROM users").fetchall()
            users: List[UserProfile] = []
            for r in rows:
                u = dict(r)
                # Parse JSON fields back to objects
                preferences: List[str] = json.loads(u['preferences']) if u['preferences'] else []
                allergies: List[str] = json.loads(u['allergies']) if u['allergies'] else []
                schedule: Dict[str, Any] = json.loads(u['schedule']) if u['schedule'] else {}
                special_instructions: str = u.get('special_instructions') or ""
                
                user_profile = UserProfile(
                    id=u['id'],
                    name=u['name'],
                    preferences=preferences,
                    allergies=allergies,
                    schedule=schedule,
                    special_instructions=special_instructions
                )
                users.append(user_profile)
            
            DatabaseLogger.users_retrieved(len(users))
            return users
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise
    
def get_user(user_id: str) -> Optional[UserProfile]:
    try:
        with get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row:
                u = dict(row)
                # Parse JSON fields back to objects
                preferences: List[str] = json.loads(u['preferences']) if u['preferences'] else []
                allergies: List[str] = json.loads(u['allergies']) if u['allergies'] else []
                schedule: Dict[str, Any] = json.loads(u['schedule']) if u['schedule'] else {}
                special_instructions: str = u.get('special_instructions') or ""
                
                user_profile = UserProfile(
                    id=u['id'],
                    name=u['name'],
                    preferences=preferences,
                    allergies=allergies,
                    schedule=schedule,
                    special_instructions=special_instructions
                )
                return user_profile
            return None
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise

# --- Session Helpers ---


def create_session(session_id: str, user_id: str, meal_type: str, status: str = "INITIALIZE") -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (id, user_id, meal_type, status) VALUES (?, ?, ?, ?)",
            (session_id, user_id, meal_type, status)
        )


def update_session_status(session_id: str, status: str, options: Optional[Any] = None) -> None:
    with get_connection() as conn:
        if options:
            conn.execute("UPDATE sessions SET status = ?, current_options = ? WHERE id = ?",
                         (status, json.dumps(options), session_id))
        else:
            conn.execute(
                "UPDATE sessions SET status = ? WHERE id = ?", (status, session_id))


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row:
            d = dict(row)
            if d['current_options']:
                d['current_options'] = json.loads(d['current_options'])
            return d
        return None


if __name__ == "__main__":
    init_db()
