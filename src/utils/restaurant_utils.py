import json
import random
from typing import Any

from schema.restaurant import Restaurants

# TODO: Define & finalize pydantic types for restaurant


def get_random_restaurant(num_of_restaurants: int = 1) -> list[Any]:

    with open('./src/data/restaurants.json', 'r') as file:
        restaurants = json.load(file)

    return random.sample(restaurants, num_of_restaurants)


def map_restaurant_to_order(restaurant: Any) -> dict[str, Any]:
    return {
        "id": restaurant["id"],
        "name": restaurant["name"],
        "description": restaurant["description"],
        "items": [
            restaurant["menu"][0]
        ]
    }


def get_random_order(number_of_restaurants: int = 1) -> list[Any]:
    random_restaurants = get_random_restaurant(
        num_of_restaurants=number_of_restaurants)

    random_order = list(map(lambda restaurant: map_restaurant_to_order(restaurant=restaurant), random_restaurants))
    return random_order


def get_restaurant_list() -> Restaurants:

    with open('./src/data/restaurants.json', 'r') as file:
        restaurants = json.load(file)

    return restaurants