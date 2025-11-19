# from typing import Optional
from typing import Any
import uuid
from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.adk.tools.tool_context import ToolContext

from auto_nom_agent.tools.common_tools import update_workflow_status

from auto_nom_agent.configs import retry_options, model
from google.adk.models.google_llm import Gemini

from schema.restaurant import FoodOrder, OrderStatus
from rich.panel import Panel
from rich import box
from rich.table import Table

from rich.console import Console

console = Console()


def print_food_order(food_order: FoodOrder):
    table = Table(title=f"Food Order : {food_order.id}")
    table.add_column("Menu Item ID")
    table.add_column("Quantity")
    table.add_column("Customizations")
    for order_items in food_order.order:
        table.add_row(order_items.id, str(order_items.quantity), ",".join(order_items.customizations))

        

def place_food_order(food_order: FoodOrder) -> dict[str,Any]:
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
    

def update_order_state(order_status: OrderStatus, tool_context: ToolContext) -> dict[str,str]:
    """Updates order state list with latest order status

    Args:
        order_status (OrderStatus): dict describing the current order status

    Returns:
        dict[str,str]: dict with message and status for the update action
    """
    
    ## get current list of orders
    current_order_statuses = getattr(tool_context.state, "order_status", [])
    
    ## update list of orders
    current_order_statuses.append(order_status.model_dump())
    
    ## update the state
    tool_context.state["order_status"] = current_order_statuses
    
    ## return update status
    return {
        "status": "success",
        "message": f"order state updated with order id : {order_status.id}"
    }
    

meal_order_executor = LlmAgent(
    model = Gemini(model=model, retry_options=retry_options),
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
    * Step 1: Inform the user that you are working on executing their order.
    * Step 2: Extract the required order information from the meal information.
        * REMEMBER items from the same restaurant will be part of same order.
    * Step 3: Use `place_food_order` to place each order one at a time.
        * At the end of each order save the response using `update_order_state` tool.    
    * Once all the orders are placed, inform the user and delegate back to the parent `auto_nom` agent.
    * IMPORTANT always update workflow status using the `update_workflow_status` tool. Set the status to following values,
        * PLACING_ORDER: Before placing the order
        * ORDER_CONFIRMED: Once all the orders are placed and confirmed.
    """,
    tools=[FunctionTool(update_order_state), FunctionTool(place_food_order), FunctionTool(update_workflow_status)]
)