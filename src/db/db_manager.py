import sqlite3
import json
from pathlib import Path
from typing import Any, Optional, Dict, List
from datetime import datetime
from src.utils.logger import DatabaseLogger
from src.schema.users import UserProfile, Session

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
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            app_name VARCHAR(128) NOT NULL, 
            user_id VARCHAR(128) NOT NULL, 
            id VARCHAR(128) NOT NULL, 
            state TEXT NOT NULL, 
            create_time DATETIME NOT NULL, 
            update_time DATETIME NOT NULL, 
            PRIMARY KEY (app_name, user_id, id)
        );
        """)
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


def create_session(app_name: str, user_id: str, session_id: str, state: Dict[str, Any]) -> Session:
    """
    Creates a new session with the given app_name, user_id, session_id and state.
    Returns the created Session object.
    """
    try:
        current_time = datetime.now()
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO sessions (app_name, user_id, id, state, create_time, update_time) VALUES (?, ?, ?, ?, ?, ?)",
                (app_name, user_id, session_id, json.dumps(state), current_time, current_time)
            )
            DatabaseLogger.user_saved(f"Session {session_id[:8]}...", f"{app_name}:{user_id}")
            
            # Return the created session as a Session object
            return Session(
                app_name=app_name,
                user_id=user_id,
                id=session_id,
                state=state,
                create_time=current_time,
                update_time=current_time
            )
    except Exception as e:
        DatabaseLogger.user_save_error(f"Session {session_id[:8]}...", str(e))
        raise


def update_session_state(app_name: str, user_id: str, session_id: str, state: Dict[str, Any]) -> Optional[Session]:
    """
    Updates the state of an existing session.
    Returns the updated Session object if successful, None if session not found.
    """
    try:
        current_time = datetime.now()
        with get_connection() as conn:
            cursor = conn.execute(
                "UPDATE sessions SET state = ?, update_time = ? WHERE app_name = ? AND user_id = ? AND id = ?",
                (json.dumps(state), current_time, app_name, user_id, session_id)
            )
            if cursor.rowcount > 0:
                # Return the updated session
                return Session(
                    app_name=app_name,
                    user_id=user_id,
                    id=session_id,
                    state=state,
                    create_time=current_time,  # We don't have the original create_time, using current
                    update_time=current_time
                )
            return None
    except Exception as e:
        DatabaseLogger.user_save_error(f"Update session {session_id[:8]}...", str(e))
        raise


def get_session(app_name: str, user_id: str, session_id: str) -> Optional[Session]:
    """
    Retrieves a session by app_name, user_id, and session_id.
    Returns a Session object or None if not found.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE app_name = ? AND user_id = ? AND id = ?", 
                (app_name, user_id, session_id)
            ).fetchone()
            if row:
                session_data = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                return Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
            return None
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise


def get_session_by_id(session_id: str) -> Optional[Session]:
    """
    Retrieves a session using just the session ID.
    Note: This may return multiple sessions if the same ID exists across different apps/users.
    Returns the first match found as a Session object.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM sessions WHERE id = ? LIMIT 1", 
                (session_id,)
            ).fetchone()
            if row:
                session_data = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                return Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
            return None
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise


def get_user_sessions(app_name: str, user_id: str) -> List[Session]:
    """
    Retrieves all sessions for a specific app_name and user_id.
    Returns a list of Session objects.
    """
    try:
        with get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM sessions WHERE app_name = ? AND user_id = ? ORDER BY update_time DESC", 
                (app_name, user_id)
            ).fetchall()
            sessions: List[Session] = []
            for row in rows:
                session_data: Dict[str, Any] = dict(row)
                # Parse the JSON state back to a dictionary
                state: Dict[str, Any] = json.loads(session_data['state']) if session_data['state'] else {}
                
                session = Session(
                    app_name=session_data['app_name'],
                    user_id=session_data['user_id'],
                    id=session_data['id'],
                    state=state,
                    create_time=datetime.fromisoformat(session_data['create_time']),
                    update_time=datetime.fromisoformat(session_data['update_time'])
                )
                sessions.append(session)
            return sessions
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise


def get_session_state_val(session_id: str, key: str) -> Optional[Any]:
    """
    Retrieves a specific state value from a session using session_id and key.
    Returns None if session not found or key doesn't exist in state.
    """
    try:
        with get_connection() as conn:
            row = conn.execute(
                "SELECT state FROM sessions WHERE id = ? LIMIT 1", 
                (session_id,)
            ).fetchone()
            if row:
                state_json = row['state']
                if state_json:
                    state = json.loads(state_json)
                    return state.get(key)
            return None
    except Exception as e:
        DatabaseLogger.user_retrieval_error(str(e))
        raise


def delete_session(app_name: str, user_id: str, session_id: str) -> bool:
    """
    Deletes a session by app_name, user_id, and session_id.
    Returns True if session was deleted, False if not found.
    """
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM sessions WHERE app_name = ? AND user_id = ? AND id = ?", 
                (app_name, user_id, session_id)
            )
            return cursor.rowcount > 0
    except Exception as e:
        DatabaseLogger.user_save_error(f"Delete session {session_id[:8]}...", str(e))
        raise


if __name__ == "__main__":
    init_db()
