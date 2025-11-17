import random

from utils import restaurant_utils
state = {}


def run_food_scout_agent():
    ## read for user dietary preferences
    print(f"---- FoodScout : Reading dietary preferences ----")
    ## read for other user preferences
    print(f"---- FoodScout : Reading user food preferences ----")
    ## read last 5 orders & user feedback on those orders
    print(f"---- FoodScout : Reading past orders & feedback ----")
    ## get current day/date and weather
    print(f"---- FoodScout : Reading today's weather ----")
    ## get list of restaurants that deliver to user address
    print(f"---- FoodScout : Reading list of restaurants that deliver to user address ----")
    ## select 3 restaurants based on all the factors & my intelligence 
    print(f"---- FoodScout : Selecting 3 restaurants based on all the factors & my intelligence  ----")
    
    # for now select 3 random restaurants from restaurant.json
    random_restaurants = restaurant_utils.get_random_order(3)    
    print(f"---- FoodScout : Selected 3 restaurants --- ", random_restaurants)
    state["food_options"] = random_restaurants


def run_notification_agent():
    print(f"---- NotificationAgent : Reading Food Options ----")
    print(f"---- NotificationAgent : Sending Notification ---- {state.get('food_options')}")


def user_confirmation():
    random_confirmation = random.randint(1,3)
    print(f"---- user_confirmation : User confirmed choice {random_confirmation} ----")
    state["user_choice"] = random_confirmation

def run_order_agent():
    # Safely retrieve user_choice as an integer (default to 1)
    user_choice = int(state.get("user_choice", 1))
    food_options = state.get("food_options", [])
    if not food_options:
        print("---- OrderAgent : No food options available ----")
        return
    # Clamp index to valid range
    index = max(0, min(len(food_options) - 1, user_choice - 1))
    order_details = food_options[index]
    print(f"---- OrderAgent : Ordering Food {order_details}")


def main():
    """_summary_
    """
    ## step 1: scheduler triggered the agent
    print(f"---- 11:00 AM: Lunchtime trigger fired ----")
    
    ## step 2: trigger the FoodScoutAgent - to find restaurants/food
    run_food_scout_agent()

    ## step 3: trigger the NotificationAgent - to notify user with the options
    run_notification_agent()
    
    ## step 4: user confirmed the choice or 30 mins passed
    user_confirmation()
    
    ## step 5: trigger OrderAgent
    run_order_agent()
    

if __name__ == "__main__":
    main()