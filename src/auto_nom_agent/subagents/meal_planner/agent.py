from google.adk.agents import LlmAgent, LoopAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext
from pydantic import BaseModel, Field

from schema.restaurant import Restaurants
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


def update_user_choice(choice: int, tool_context: ToolContext) -> dict[str, str]:
    """
    Updates the state with the choice number that the user selected. 

    Args:
        choice (int): number representing the user selection

    Returns:
        dict[str,str]: response dictionary with update operation status and message
    """
    tool_context.state["user_choice"] = choice
    tool_context.state["workflow_status"] = "PLACING_ORDER"

    return {
        "status": "success",
        "message": "User restaurant choice has been saved"
    }


def update_user_feedback(feedback: str, tool_context: ToolContext) -> dict[str, str]:
    """
    Updates the state with the feedback provided by the user. 

    Args:
        choice (int): number representing the user selection

    Returns:
        dict[str,str]: response dictionary with update operation status and message
    """
    tool_context.state["meal_options_feedback"] = feedback
    # tool_context.state["workflow_status"] = "PLACING_ORDER"

    return {
        "status": "success",
        "message": "User feedback has been saved"
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


meal_choice_generator_in_loop = LlmAgent(
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
    {meal_options_feedback}

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
    tools=[FunctionTool(get_restaurant_list_tool)]
)


def get_user_response_tool(question: str, tool_context: ToolContext) -> str:
    """
    Asks the user a question and pauses execution until they reply.

    Args:
        question (str): The question to ask the user (e.g., "Which option do you prefer?").
    """
    # 1. Check if we already have the user's confirmation (input)
    if tool_context.tool_confirmation:
        # We are RESUMING after the user replied!
        # The user's input is in the confirmation payload
        tool_confirmation = tool_context.tool_confirmation
        payload = getattr(tool_confirmation, "payload", None)
        if not payload:
            # Defensive: payload missing or None
            return "No confirmation payload available."
        user_reply = payload.get("user_reply")
        if user_reply is None:
            # Defensive: payload exists but does not contain expected key
            return "No user reply found in confirmation payload."
        return f"User replied: {user_reply}"

    # 2. If no confirmation yet, PAUSE the agent
    print(f"--- ⏸️ PAUSING FOR USER INPUT: {question} ---")

    # This sends a signal to the runner to stop.
    # The 'payload' is what the UI/Client will receive so it knows what to show.
    tool_context.request_confirmation(
        hint=question,
        payload={"type": "user_input_request"}
    )

    # We return a placeholder, but the agent won't see this until it resumes.
    return "Waiting for user input..."


meal_choice_verifier_in_loop = LlmAgent(
    model="gemini-2.5-flash",
    name="MealChoiceVerifier",
    description="Shares the meal options with the user and confirms their choice",
    instruction="""
    You are a helpful, polite and cheerful assistant whose role is to share the following meal options with the user 
    and save their response.
    
    ** Meal Options **
    {meal_options}
    
    ** Task **
    * IMPORTANT DO NOT share any IDs with the user.
    * IMPORTANT only give options from Meal Options
    * Number each option for easier selection.
    * IMMEDIATELY use the `get_user_response_tool` to ask: "Which option would you like?"
    * When the tool returns the user's answer, analyze it:
        - If they picked a number, use `update_user_choice`.
        - If they gave feedback (e.g., "I don't like these"), use `update_user_feedback`.    
    """,
    tools=[
        FunctionTool(get_user_response_tool),
        FunctionTool(update_user_choice),
        FunctionTool(update_user_feedback)]
)

meal_planner = LoopAgent(
    name="MealPlanner",
    # Agent order is crucial: Critique first, then Refine/Exit
    sub_agents=[
        meal_choice_generator_in_loop,
        meal_choice_verifier_in_loop,
    ],
    max_iterations=5  # Limit loops
)
