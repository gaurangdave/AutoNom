# from typing import Optional
from typing import Any, Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.tool_context import ToolContext

from src.schema.restaurant import Restaurants
from src.schema.meals import MealOptions
from src.utils.restaurant_utils import (
    get_restaurant_list,
    get_restaurant_detail,
    get_cuisines,
    get_restaurants_by_cuisine,
    get_tags,
    get_restaurants_by_tags,
    get_menu_items,
    get_dietary_tags,
    get_menu_items_by_dietary_tags
)
from src.auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini
from google.adk.agents.callback_context import CallbackContext

from src.utils.state import is_valid_transition


def get_restaurant_list_tool(tool_context: ToolContext) -> dict[str, Restaurants]:
    """Gets the list of Restaurants that delivers food in the area.

    Returns:
        Restaurants: List of type Restaurant
    """
    restaurant_list = get_restaurant_list()
    return {
        "restaurant_list": restaurant_list
    }


def get_available_cuisines_list(tool_context: ToolContext) -> dict[str, Any]:
    """Gets the list of available cuisines from restaurants in the area.

    Returns:
        dict[str, Any]: Dictionary containing list of cuisines
    """
    cuisines = get_cuisines()
    return {
        "cuisines": cuisines
    }


def get_restaurant_detail_tool(tool_context: ToolContext, restaurant_id: str) -> dict[str, Any]:
    """Gets detailed information for a specific restaurant.

    Args:
        restaurant_id (str): The unique identifier for the restaurant

    Returns:
        dict[str, Any]: Dictionary containing restaurant details
    """
    restaurant = get_restaurant_detail(restaurant_id)
    return {
        "restaurant": restaurant
    }


def get_restaurants_by_cuisine_tool(tool_context: ToolContext, cuisine: str) -> dict[str, Any]:
    """Gets restaurants filtered by cuisine type.

    Args:
        cuisine (str): The cuisine type to filter by (e.g., "Italian", "Mexican")

    Returns:
        dict[str, Any]: Dictionary containing filtered restaurants
    """
    result = get_restaurants_by_cuisine(cuisine)
    return result


def get_tags_tool(tool_context: ToolContext) -> dict[str, Any]:
    """Gets the list of available restaurant tags.

    Returns:
        dict[str, Any]: Dictionary containing list of tags
    """
    tags = get_tags()
    return {
        "tags": tags
    }


def get_restaurants_by_tags_tool(tool_context: ToolContext, tags: list[str]) -> dict[str, Any]:
    """Gets restaurants filtered by tags.

    Args:
        tags (list[str]): List of tags to filter by (e.g., ["Fast Food", "Healthy"])

    Returns:
        dict[str, Any]: Dictionary containing filtered restaurants
    """
    result = get_restaurants_by_tags(tags)
    return result


def get_menu_items_tool(tool_context: ToolContext, restaurant_id: Optional[str] = None) -> dict[str, Any]:
    """Gets menu items, optionally filtered by restaurant.

    Args:
        restaurant_id (str, optional): The restaurant ID to filter menu items

    Returns:
        dict[str, Any]: Dictionary containing menu items
    """
    result = get_menu_items(restaurant_id)
    return result


def get_dietary_tags_tool(tool_context: ToolContext) -> dict[str, Any]:
    """Gets the list of available dietary tags from menu items.

    Returns:
        dict[str, Any]: Dictionary containing list of dietary tags
    """
    dietary_tags = get_dietary_tags()
    return {
        "dietary_tags": dietary_tags
    }


def get_menu_items_by_dietary_tags_tool(tool_context: ToolContext, tags: list[str]) -> dict[str, Any]:
    """Gets menu items filtered by dietary tags.

    Args:
        tags (list[str]): List of dietary tags to filter by (e.g., ["Vegan", "Gluten-Free"])

    Returns:
        dict[str, Any]: Dictionary containing filtered menu items
    """
    result = get_menu_items_by_dietary_tags(tags)
    return result


restaurant_scout_agent = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
    name="restaurant_scout_agent",
    description="Scans various restaurant options and generates choice of 3 options",
    instruction="""
    You are a creative and diligent restaurant scout. 
    Your role is to find the restaurants and meal options for the user based on their feedback and preferences. 
    
    ** User Preferences **
    Dietary Preferences : 
    {user_dietary_preferences}
    
    Allergies : 
    {user_allergies}
    
    ** User Feedback **
    Previously Shared Options:
    {meal_options}
    
    Feedback on previous options:
    {user_feedback}
    
    ** Task **
    * Use the following tools finalize 3 restaurants based on `User Preferences` and `User Feedback` on previous suggestions.
        * `get_restaurant_list_tool` tool to get the list of restaurants that deliver in users location.
        * `get_available_cuisines_list` tool to get the list of available cuisines from restaurants in the area.
        * `get_restaurant_detail_tool` tool to get detailed information for a specific restaurant.
        * `get_restaurants_by_cuisine_tool` tool to get restaurants filtered by cuisine type.
        * `get_tags_tool` tool to get list of available restaurant tags e.g.  "100% Vegan","Artisan","Authentic" etc.
        * `get_restaurants_by_tags_tool` tool to get restaurants filtered by tags.
        * `get_menu_items_tool` tool to get menu items filtered by restaurant.
        * `get_dietary_tags_tool` tool to get list of available dietary tags e.g. "Gluten-Free","High-Protein","Spicy" etc.
        * `get_menu_items_by_dietary_tags_tool` tool to get menu items filtered by dietary tags            
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
    # output_schema=MealOptions,
    tools=[
        FunctionTool(get_restaurant_list_tool), FunctionTool(
            get_available_cuisines_list),
        FunctionTool(get_restaurant_detail_tool), FunctionTool(
            get_restaurants_by_cuisine_tool),
        FunctionTool(get_tags_tool), FunctionTool(
            get_restaurants_by_tags_tool),
        FunctionTool(get_menu_items_tool), FunctionTool(get_dietary_tags_tool),
        FunctionTool(get_menu_items_by_dietary_tags_tool)
    ],
)


def update_meal_options(options: MealOptions, tool_context: ToolContext) -> dict[str, str]:
    """Saves the selected meal options for the user

    Args:
        options (MealOptions): dictionary representing list of meal options

    Returns:
        dict[str,str]: response dictionary with update operation status and message
    """
    tool_context.state["meal_options"] = options.model_dump()

    return {
        "status": "success",
        "message": "meal options are saved successfully"
    }


def on_before_meal_planner_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "MEAL_PLANNING_STARTED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


def on_after_meal_planner_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "MEAL_PLANNING_COMPLETE"

    # verify if we have meal options
    meal_options = callback_context.state["meal_options"]
    options = meal_options.get("options", [])

    if len(options) == 0:
        new_state = "MEAL_PLANNING_FAILED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


meal_planner = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
    name="MealPlanner",
    description="Scans various restaurant options and generates choice of 3 options",
    instruction="""
    You are a creative and diligent meal planner. 
    Your role is to plan a perfect next meal for the user.
    To do that you have access to following agent and tools
    * `restaurant_scout_agent` tool that will research and return 3 restaurants based on user preferences and feedback.        

    ** Your Duties **
    * Step 0: Welcome the user and inform them that you are finding restaurants for them in an exciting manner. 
    * Step 1: Use the `restaurant_scout_agent` tool to get the list of restaurants for the user.
    * Step 2: IMPORTANT after getting the list of restaurants use the `update_meal_options` tool to save the options for the user. DO NOT SKIP THIS STEP
    * Step 3: After updating the state, your task is done. Delegate back to parent `auto_nom` agent.
    ** Current Workflow Status **
    {workflow_status}
    
    ** User Feedback **
    Previously Shared Options:
    {meal_options}
    
    Feedback on previous options:
    {user_feedback}
    
    """,
    tools=[AgentTool(restaurant_scout_agent), FunctionTool(
        update_meal_options)],
    before_agent_callback=on_before_meal_planner_agent_call,
    after_agent_callback=on_after_meal_planner_agent_call
)
