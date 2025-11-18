from typing import Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext
from pydantic import BaseModel, Field

from schema.restaurant import Restaurants
from utils.restaurant_utils import get_restaurant_list
# from pydantic import BaseModel,Field
from google.adk.agents.callback_context import CallbackContext
from google.genai import types


def get_restaurant_list_tool(tool_context: ToolContext) -> dict[str, Restaurants]:
    """Gets the list of Restaurants that delivers food in the area.

    Returns:
        Restaurants: List of type Restaurant
    """
    restaurant_list = get_restaurant_list()
    return {
        "restaurant_list": restaurant_list
    }


class Order(BaseModel):
    id: str = Field(description="Menu item id")
    name: str = Field(description="Menu item name")
    price: float = Field(description="Menu item price")
    calories: float = Field(description="Menu item calories")


class Meals(BaseModel):
    id: str = Field(description="Restaurant ID")
    name: str = Field(description="Restaurant Name")
    description: str = Field(description="Restaurant description")
    order: list[Order] = Field(
        description="list of orders from the restaurant")


class MealOptions(BaseModel):
    options: list[Meals] = Field(description="List of Meals")


def _before_agent_callback(callback_context: CallbackContext) -> Optional[types.Content]:
    print(f"before agent callback...")
    return None


def _after_agent_callback(callback_context: CallbackContext) -> Optional[types.Content]:
    print(f"after agent callback...")
    return None


meal_planner = LlmAgent(
    model="gemini-2.5-flash",
    name="MealChoiceGenerator",
    description="Scans various restaurant options and generates choice of 3 options",
    instruction="""
    You are a creative and diligent meal planner. 
    Your role is to find the restaurants and meal options for the user based on their feedback and preferences. 
    
    ** User Preferences **
    Dietary Preferences : {user_dietary_preferences}
    Allergies : {user_allergies}
    
    ** User Feedback **
    Previously Shared Options:
    {meal_options}
    
    Feedback:
    {user_feedback}

    ** Task **
    * Use the `get_restaurant_list_tool` tool to get the list of restaurants that deliver in users location
    * Finalize 3 restaurants based on `User Preferences` and `User Feedback` on previous suggestions.
    * IMPORTANT your response MUST be a valid JSON matching this structure
    {
        "options":[
            {
                "id": "Restaurant ID goes here",
                "name": "Restaurant Name goes here",
                "description": "Restaurant description goes here",
                "order": [{
                    "id": "Menu item id goes here",
                    "name": "Menu item name goes here",
                    "price": "Menu item price goes here",
                    "calories": "Menu item calories goes here"
                }]
            }
        ]
    }
    """,
    tools=[FunctionTool(get_restaurant_list_tool)],
    before_agent_callback=_before_agent_callback,
    after_agent_callback=_after_agent_callback
)
