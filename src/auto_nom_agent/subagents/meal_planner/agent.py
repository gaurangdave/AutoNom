from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext

from schema.restaurant import Restaurant, Restaurants
from utils.restaurant_utils import get_restaurant_list
# from pydantic import BaseModel,Field


def get_restaurant_list_tool(tool_context: ToolContext) -> dict[str, Restaurants]:
    """Gets the list of Restaurants that delivers food in the area.

    Returns:
        Restaurants: List of type Restaurant
    """
    restaurant_list = get_restaurant_list()
    return {
        "restaurant_list": restaurant_list
    }


def update_user_choice(restaurant: Restaurant, tool_context: ToolContext):
    tool_context.state["user_choice"] = restaurant
    tool_context.state["workflow_status"] = "PLACING_ORDER"
    return {
        "status": "success",
        "message": "User restaurant choice has been saved"
    }


meal_planner = LlmAgent(
    model="gemini-2.5-flash",
    name="meal_planner",
    description="Plans meals for the user based on user preferences and dietary restrictions",
    instruction="""You are a creative and diligent meal planner. Your role is to find the restaurants and plan users next meal based on user preferences below,
    
    ** User Preferences **
    Dietary Preferences : {user_dietary_preferences}
    Allergies : {user_allergies}
    
    ** Responsibilities **
    * Use the `get_restaurant_list` tool to get the list of restaurants that deliver to the user.
    * Filter the list based on user preferences and give the user 3 options to select from. Each option should have the restaurant name, food recommendation and cost. 
    * **ONLY GIVE OPTION FROM THE LIST**
    * Once the user finalizes the option, use the `update_user_choice` tool update the choice. 
    * Delegate the control back to the `auto_nom_agent`.
    """,
    tools=[FunctionTool(get_restaurant_list_tool), FunctionTool(update_user_choice)]
)
