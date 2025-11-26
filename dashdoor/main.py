import json
from fastapi import FastAPI, HTTPException
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Dict, Any

DATA_PATH = Path(__file__).parent / "data/restaurants.json"
RESTAURANTS: List[Dict[str, Any]] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global RESTAURANTS
    if DATA_PATH.exists():
        with open(DATA_PATH, "r") as f:
            data = json.load(f)
            RESTAURANTS.clear()
            RESTAURANTS.extend(data)
        print(f"✅ DashDoor loaded {len(RESTAURANTS)} restaurants.")
    else:
        print("⚠️ No data found in restaurants.json")
    yield

app = FastAPI(title="DashDoor API 🍔", lifespan=lifespan)

@app.get("/")
def read_root() -> Dict[str, Any]:
    return {"status": "DashDoor is open for business!", "restaurant_count": len(RESTAURANTS)}

@app.get("/api/v1/restaurants")
def get_restaurants():
    """Returns all restaurants (mocking a search feed)"""
    return RESTAURANTS

@app.get("/api/v1/restaurants/{restaurant_id}")
def get_restaurant_detail(restaurant_id: str):
    """Returns details for a specific restaurant"""
    for r in RESTAURANTS:
        if r["id"] == restaurant_id:
            return r
    raise HTTPException(status_code=404, detail="Restaurant not found")