import json
from fastapi import FastAPI, HTTPException
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

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

@app.get("/api/v1/cuisines")
def get_cuisines() -> Dict[str, List[str]]:
    """Returns list of unique cuisines available"""
    cuisines: set[str] = set()
    for r in RESTAURANTS:
        if "cuisine" in r and r["cuisine"]:
            cuisines.add(r["cuisine"])
    return {"cuisines": sorted(list(cuisines))}

@app.get("/api/v1/restaurants/by-cuisine")
def get_restaurants_by_cuisine(cuisine: str) -> Dict[str, Any]:
    """Returns restaurants filtered by cuisine type"""
    filtered: List[Dict[str, Any]] = [r for r in RESTAURANTS if r.get("cuisine", "").lower() == cuisine.lower()]
    return {"cuisine": cuisine, "count": len(filtered), "restaurants": filtered}

@app.get("/api/v1/tags")
def get_tags() -> Dict[str, List[str]]:
    """Returns list of unique restaurant tags"""
    tags: set[str] = set()
    for r in RESTAURANTS:
        if "tags" in r and r["tags"]:
            tags.update(r["tags"])
    return {"tags": sorted(list(tags))}

@app.get("/api/v1/restaurants/by-tags")
def get_restaurants_by_tags(tags: str) -> Dict[str, Any]:
    """Returns restaurants filtered by tags (comma-separated)"""
    tag_list = [t.strip() for t in tags.split(",")]
    filtered: List[Dict[str, Any]] = []
    for r in RESTAURANTS:
        restaurant_tags = r.get("tags", [])
        if any(tag in restaurant_tags for tag in tag_list):
            filtered.append(r)
    return {"tags": tag_list, "count": len(filtered), "restaurants": filtered}

@app.get("/api/v1/menu-items")
def get_menu_items(restaurant_id: Optional[str] = None) -> Dict[str, Any]:
    """Returns menu items, optionally filtered by restaurant_id"""
    menu_items: List[Dict[str, Any]] = []
    
    if restaurant_id:
        for r in RESTAURANTS:
            if r["id"] == restaurant_id:
                for item in r.get("menu", []):
                    menu_items.append({**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})
                break
    else:
        for r in RESTAURANTS:
            for item in r.get("menu", []):
                menu_items.append({**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})
    
    return {"count": len(menu_items), "menu_items": menu_items}

@app.get("/api/v1/dietary-tags")
def get_dietary_tags() -> Dict[str, List[str]]:
    """Returns list of unique dietary tags from all menu items"""
    dietary_tags: set[str] = set()
    for r in RESTAURANTS:
        for item in r.get("menu", []):
            if "dietary_tags" in item and item["dietary_tags"]:
                dietary_tags.update(item["dietary_tags"])
    return {"dietary_tags": sorted(list(dietary_tags))}

@app.get("/api/v1/menu-items/by-dietary-tags")
def get_menu_items_by_dietary_tags(tags: str) -> Dict[str, Any]:
    """Returns menu items filtered by dietary tags (comma-separated)"""
    tag_list = [t.strip() for t in tags.split(",")]
    menu_items: List[Dict[str, Any]] = []
    
    for r in RESTAURANTS:
        for item in r.get("menu", []):
            item_tags = item.get("dietary_tags", [])
            if any(tag in item_tags for tag in tag_list):
                menu_items.append({**item, "restaurant_id": r["id"], "restaurant_name": r["name"]})
    
    return {"dietary_tags": tag_list, "count": len(menu_items), "menu_items": menu_items}


