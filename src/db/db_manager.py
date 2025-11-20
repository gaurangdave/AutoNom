import sqlite3
import json
from pathlib import Path
from typing import Any, Optional, Dict, List

CURRENT_DIR = Path(__file__).parent
DB_PATH = CURRENT_DIR / "data/autonom.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row 
    return conn

def init_db():
    with get_connection() as conn:
        # Users Table
        conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            preferences TEXT, -- JSON string
            allergies TEXT,   -- JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        # Sessions Table (For history and state)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            meal_type TEXT,
            status TEXT,
            current_options TEXT, -- JSON string (The 3 restaurants)
            chosen_option TEXT,   -- JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        # Orders Table (Final output)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            meal_details TEXT, -- JSON string
            status TEXT
        );
        """)
        print(f"✅ Database initialized at: {DB_PATH}")

def upsert_user(user_id: str, name: str, preferences: Any, allergies: Any) -> None:
    with get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO users (id, name, preferences, allergies) VALUES (?, ?, ?, ?)",
            (user_id, name, json.dumps(preferences), json.dumps(allergies))
        )

def get_all_users() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM users").fetchall()
        return [dict(r) for r in rows]

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
            conn.execute("UPDATE sessions SET status = ? WHERE id = ?", (status, session_id))

def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row:
            d = dict(row)
            # Auto-parse JSON fields for convenience
            if d['current_options']: d['current_options'] = json.loads(d['current_options'])
            return d
        return None

if __name__ == "__main__":
    init_db()