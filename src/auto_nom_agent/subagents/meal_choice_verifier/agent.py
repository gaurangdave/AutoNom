# from typing import Optional
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext

from src.auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini
from google.adk.agents.callback_context import CallbackContext

from src.utils.state import is_valid_transition


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


def update_meal_choice_verification_message(meal_choice_verification_message: str, tool_context: ToolContext) -> dict[str, str]:
    """Updates the state with the meal choice verification message

    Args:
        meal_choice_verification_message (str): meal choice verification message that we send to the users

    Returns:
        dict[str, str]: response dictionary with update operation status and message
    """
    tool_context.state["meal_choice_verification_message"] = meal_choice_verification_message

    return {
        "status": "success",
        "message": "Meal choice verification message has been saved"
    }


def on_before_meal_verifier_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "MEAL_PLANNING_COMPLETE"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


def on_after_meal_verifier_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "AWAITING_USER_APPROVAL"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


meal_choice_verifier = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
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
    * Format a nice friendly message to share the options to the user and save the message using the `update_meal_choice_verification_message` tool
    * Share the message with the user and wait for user response.
    * The user can either choose 1 or more option or can reject them all with some feedback. 
    * When the tool returns the user's answer, analyze it:
        - IMPORTANT If they picked a number, use `update_user_choice` tool to save the choice.
        - IMPORTANT If they gave feedback (e.g., "I don't like these"), use `update_user_feedback` to save the feedback.
    * Delegate the user back to the parent `auto_nom` agent.
    """,
    tools=[
        FunctionTool(update_user_choice),
        FunctionTool(update_meal_choice_verification_message),
        FunctionTool(update_user_feedback)],
    before_agent_callback=on_before_meal_verifier_agent_call,
    after_agent_callback=on_after_meal_verifier_agent_call

)
