from pydantic import BaseModel
from typing import List

class MenuItem(BaseModel):
    menuItemId: str
    name: str
    price: str
    calories: str

class Restaurant(BaseModel):
    id: str
    name: str
    description: str
    menu: List[MenuItem]

class Restaurants(BaseModel):
    restaurants: List[Restaurant]
