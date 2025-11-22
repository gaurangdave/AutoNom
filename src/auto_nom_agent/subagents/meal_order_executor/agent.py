# from typing import Optional
from typing import Any
import uuid
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext


from src.auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini

from src.schema.restaurant import FoodOrder, OrderStatus
from rich.table import Table

from rich.console import Console
from google.adk.agents.callback_context import CallbackContext

from src.utils.state import is_valid_transition

console = Console()


def print_food_order(food_order: FoodOrder):
    table = Table(title=f"Food Order : {food_order.id}")
    table.add_column("Menu Item ID")
    table.add_column("Quantity")
    table.add_column("Customizations")
    for order_items in food_order.order:
        table.add_row(order_items.id, str(order_items.quantity),
                      ",".join(order_items.customizations))


def place_food_order(food_order: FoodOrder) -> dict[str, Any]:
    """Places the food order with the restaurant and returns the order status

    Args:
        food_order (FoodOrder): dict describing the order for the restaurant

    Returns:
        dict[str,Any]: dict describing the operation status, message and order_status dict
    """
    # print food order for now.
    print_food_order(food_order=food_order)
    # create dummy Order status
    order_status = OrderStatus(
        id=str(uuid.uuid4()),
        restaurant_id=food_order.id,
        total_bill=120.32,
        status="ORDER_PLACED",
    )

    return {
        "status": "success",
        "message": "Order placed successfully",
        "order_status": order_status
    }


def update_order_state(order_status: OrderStatus, tool_context: ToolContext) -> dict[str, str]:
    """Updates order state list with latest order status

    Args:
        order_status (OrderStatus): dict describing the current order status

    Returns:
        dict[str,str]: dict with message and status for the update action
    """

    # get current list of orders
    current_order_statuses = getattr(tool_context.state, "order_status", [])

    # update list of orders
    current_order_statuses.append(order_status.model_dump())

    # update the state
    tool_context.state["order_status"] = current_order_statuses

    # return update status
    return {
        "status": "success",
        "message": f"order state updated with order id : {order_status.id}"
    }

def update_order_confirmation_message(order_confirmation_message: str, tool_context: ToolContext) -> dict[str, str]:
    """Updates order state list with latest order status

    Args:
        order_status (OrderStatus): dict describing the current order status

    Returns:
        dict[str,str]: dict with message and status for the update action
    """

    # update the state
    tool_context.state["order_confirmation_message"] = order_confirmation_message

    # return update status
    return {
        "status": "success",
        "message": f"state updated with order confirmation message"
    }

def on_before_meal_order_executor_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "PLACING_ORDER"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


def on_after_meal_order_executor_agent_call(callback_context: CallbackContext) -> None:
    current_state = callback_context.state["workflow_status"]
    new_state = "ORDER_CONFIRMED"

    if is_valid_transition(current_state, new_state):
        callback_context.state["workflow_status"] = new_state

    return None


meal_order_executor = LlmAgent(
    model=Gemini(model=model, retry_options=retry_options),
    name="MealOrderExecutor",
    description="Orders food from restaurant based on user preferences and chooses restaurant",
    instruction="""
    You are a diligent and detailed agent who orders meals for the user.
    Your role is to use the meal information below and place one or more orders using the `place_food_order` tool.
    
    ** Meal Information ** 
    *** User Preferences ***
    Dietary Preferences : {user_dietary_preferences}
    Allergies : {user_allergies}
    
    *** Restaurant List ***
    This is the list of available restaurant and menu items
    {meal_options}
    
    *** User Choice ***
    This is the list of choices that user made
    {user_choice}

    ** Your Duties **
    * Step 1: Extract the required order information from the meal information.
        * REMEMBER items from the same restaurant will be part of same order.
    * Step 2: Use `place_food_order` to place each order one at a time.
        * At the end of each order save the response using `update_order_state` tool.    
    * Step 3: Once all the orders are placed, create a friendly message summarizing the order for the user and use the `update_order_confirmation_message` tool to save the message.
    * Your task is done delegate back to the parent `auto_nom` agent.
    """,
    tools=[FunctionTool(update_order_state), FunctionTool(
        place_food_order), FunctionTool(update_order_confirmation_message)],
    before_agent_callback=on_before_meal_order_executor_agent_call,
    after_agent_callback=on_after_meal_order_executor_agent_call

)
