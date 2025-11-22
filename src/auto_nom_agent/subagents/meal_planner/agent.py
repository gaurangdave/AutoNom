# from typing import Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.tool_context import ToolContext

from src.schema.restaurant import Restaurants
from src.schema.meals import MealOptions
from src.utils.restaurant_utils import get_restaurant_list
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
    * Use the `get_restaurant_list_tool` tool to get the list of restaurants that deliver in users location.
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
    # output_schema=MealOptions,
    tools=[FunctionTool(get_restaurant_list_tool)],
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
