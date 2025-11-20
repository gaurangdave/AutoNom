# from typing import Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.agent_tool import AgentTool
from google.adk.tools.tool_context import ToolContext

from src.schema.restaurant import Restaurants
from src.schema.meals import MealOptions
from src.auto_nom_agent.tools.common_tools import update_workflow_status
from src.utils.restaurant_utils import get_restaurant_list
from src.auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini



def update_user_choice(choice: list[int], tool_context: ToolContext) -> dict[str, str]:
    """
    Updates the state with the choice number that the user selected. 

    Args:
        choice (int): number representing the user selection

    Returns:
        dict[str,str]: response dictionary with update operation status and message
    """
    tool_context.state["user_choice"] = choice
    tool_context.state["workflow_status"] = "USER_APPROVAL_RECEIVED"

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
    tool_context.state["user_feedback"] = feedback
    tool_context.state["workflow_status"] = "USER_REJECTION_RECEIVED"

    return {
        "status": "success",
        "message": "User feedback has been saved"
    }


meal_choice_verifier = LlmAgent(
    model=Gemini(model=model,retry_options=retry_options),
    name="MealChoiceVerifier",
    description="Shares the meal options with the user and confirms their choice",
    instruction="""
    You are a helpful, polite and cheerful assistant whose role is to share the following meal options with the user 
    and save their response.
    
    ** Meal Options **
    {meal_options}
    
    ** Task **
    * IMPORTANT DO NOT share any IDs with the user.
    * IMPORTANT only give options from Meal Options.
    * If there are multiple options from same restaurant, break it down into different choices.
    * Important Number each choice for easier selection.
    * Share the choices with the user to get their response with a friendly message.
    * Wait for user response.
    * The user can either choose 1 or more option or can reject them all with some feedback. 
    * When the tool returns the user's answer, analyze it:
        - If they picked a number, use `update_user_choice` tool to save the choice.
        - If they gave feedback (e.g., "I don't like these"), use `update_user_feedback` to save the feedback.
    * Delegate the user back to the parent `meal_planner` agent.
    """,
    tools=[
        FunctionTool(update_user_choice),
        FunctionTool(update_user_feedback)]
)



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
    model=Gemini(model=model,retry_options=retry_options),
    name="restaurant_scout_agent",
    description="Scans various restaurant options and generates choice of 3 options",
    instruction="""
    You are a creative and diligent restaurant scout. 
    Your role is to find the restaurants and meal options for the user based on their feedback and preferences. 
    
    ** User Preferences **
    Dietary Preferences : {user_dietary_preferences}
    Allergies : {user_allergies}
    
    ** User Feedback **
    Previously Shared Options:
    {meal_options}
    
    Feedback on previous options:
    {user_feedback}
    
    ** Task **
    * Update the workflow status using the `update_workflow_status` tool. 
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




meal_planner = LlmAgent(
    model=Gemini(model=model,retry_options=retry_options),
    name="MealPlanner",
    description="Scans various restaurant options and generates choice of 3 options",
    instruction="""
    You are a creative and diligent meal planner. 
    Your role is to plan a perfect next meal for the user.
    To do that you have access to following agent and tools
    * `restaurant_scout_agent` tool that will research and return 3 restaurants based on user preferences and feedback.
    * `meal_choice_verifier` agent that will share the meal choices from above 3 restaurants and get user approval on one or more. 
        * If the user doesn't approve any restaurant they will give us feedback that will be used by `restaurant_scout_agent` to find more options. 
        

    ** Your Duties **
    * Step 0: Welcome the user and inform them that you are finding restaurants for them in an exciting manner. 
    * Step 1: Use the `restaurant_scout_agent` tool to get the list of restaurants for the user.
    * Step 2: IMPORTANT use the `update_meal_options` tool to save the options for the user. DO NOT SKIP THIS STEP
    * Step 3: Delegate to `meal_choice_verifier` agent to verify the choices from the user.
    * Continue repeating step 1 to 3 till user has selected a restaurant.
    * IMPORTANT always update workflow status using the `update_workflow_status` tool. Set the status to following values,
        * MEAL_PLANNING_STARTED - while searching for restaurants.
        * MEAL_PLANNING_COMPLETE - when 3 restaurants have been finalized and saved.
        * AWAITING_USER_APPROVAL - when meal options have been delivered to the user. 
        * USER_APPROVAL_RECEIVED - When user approves one or more options.
        * USER_REJECTION_RECEIVED - When user rejected all the options. 
        
        
    ** Current Workflow Status **
    {workflow_status}
    
    ** User Feedback **
    Previously Shared Options:
    {meal_options}
    
    Feedback on previous options:
    {user_feedback}
    
    User choice on previous options:
    {user_choice}

    """,
    tools=[AgentTool(restaurant_scout_agent), FunctionTool(
        update_meal_options), FunctionTool(update_workflow_status)],
    sub_agents=[meal_choice_verifier]
)
