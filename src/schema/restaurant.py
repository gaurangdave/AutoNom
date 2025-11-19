from pydantic import BaseModel, Field
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


class OrderStatus(BaseModel):
    id: str = Field(description="ID for the order")
    restaurant_id: str = Field(
        description="ID for the restaurant from where the order was placed")
    total_bill: float = Field(description="total bill amount for the order")
    status: str = Field(description="Current status for the order")


class OrderState(BaseModel):
    orders: List[OrderStatus] = Field(
        description="List of orders and their statuses")


class Order(BaseModel):
    id: str = Field(description="Menu item id")
    quantity: int = Field(description="Quantity to order")
    customizations: List[str] = Field(description="Customizations for the items",
                                      default=[],
                                      )


class FoodOrder(BaseModel):
    id: str = Field(
        description="ID for the restaurant from where the order is to be placed")
    order: List[Order] = Field(description="List of menu items to be ordered")
