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


def place_food_order(food_order: FoodOrder, tool_context: ToolContext) -> dict[str, Any]:
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

def update_order_confirmation_message(order_confirmation_message: dict[str, Any], tool_context: ToolContext) -> dict[str, str]:
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
    description="Specialized agent that executes the final food order based on user selection and preferences.",
    instruction="""
    You are a diligent and detail-oriented ordering agent. Your sole responsibility is to take the finalized meal choice and execute the order.

    **INPUT CONTEXT:**
    - **User Preferences:** {user.dietary_preferences}
    - **Allergies (CRITICAL):** {user.allergies}
    - **Available Options:** {planning.options}
    - **User Selection:** {planning.user_choice} (This is the index or ID of the chosen meal)

    **EXECUTION PLAN:**
    
    1. **Identify the Meal:** - Locate the specific restaurant and menu item corresponding to the `{planning.user_choice}` from the `{planning.options}` list.
       - *Validation:* Ensure the item does not conflict with `{user.allergies}`. If it does, STOP and ask for clarification (though this should have been caught earlier).

    2. **Place the Order:**
       - Call the `place_food_order` tool with the restaurant ID and menu item ID.
       - Wait for the tool to return a success response/order ID.
       - Use `update_order_state` to mark the order as 'PLACED'.

    3. **Generate Confirmation (The Receipt):**
       - Once the order is confirmed, you must format the final output using the `update_order_confirmation_message` tool.
       - You need to calculate the **Total Bill** (Price + simulated Tax/Tip, or just Price).
       - **Payload Structure:**
         - `message`: A friendly, celebratory text (e.g., "Great choice! Your meal is being prepared.").
         - `bill`: A structured JSON object containing the line items.

    **CONFIRMATION SCHEMA (for `update_order_confirmation_message`):**
    The `bill` argument must match this structure:
    {
        "restaurant_name": "String",
        "items": [
            {
                "name": "String (Menu Item Name)",
                "quantity": 1,
                "price": Number (Float),
                "customizations" : "String (Any customizations that you have requested)
            }
        ],
        "total_amount": Number (Float)
    }

    **CRITICAL RULES:**
    - Double-check the price. Ensure `total_amount` equals the sum of the items.
    - ALWAYS delegate back to the parent `auto_nom_agent` agent after successfully saving the confirmation.
    """,
    tools=[FunctionTool(update_order_state), FunctionTool(
        place_food_order), FunctionTool(update_order_confirmation_message)],
    before_agent_callback=on_before_meal_order_executor_agent_call,
    after_agent_callback=on_after_meal_order_executor_agent_call

)
