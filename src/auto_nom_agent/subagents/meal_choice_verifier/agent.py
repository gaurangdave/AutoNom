from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext
from auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini


def update_user_choice(choice: int, tool_context: ToolContext) -> dict[str, str]:
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
    * IMPORTANT only give options from Meal Options
    * Important Number each option for easier selection.
    * Share the options with the user to get their response with a friendly message.
    * Wait for user response.
    * When the tool returns the user's answer, analyze it:
        - If they picked a number, use `update_user_choice` tool to save the choice.
        - If they gave feedback (e.g., "I don't like these"), use `update_user_feedback` to save the feedback.
    * Delegate the user back to the `auto_nom` agent.
    """,
    tools=[
        FunctionTool(update_user_choice),
        FunctionTool(update_user_feedback)]
)
