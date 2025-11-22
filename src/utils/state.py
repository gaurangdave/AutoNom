def is_valid_transition(current_state: str, new_state: str) -> bool:
    """Helper function to check the validity of state transition

    Args:
        current_state (str): _description_
        new_state (str): _description_

    Returns:
        bool: _description_
    """
    is_valid = False

    state_transitions = {
        "IDLE": ["MEAL_PLANNING_STARTED"],
        "MEAL_PLANNING_STARTED": ["MEAL_PLANNING_COMPLETE"],
        "MEAL_PLANNING_COMPLETE": ["AWAITING_USER_APPROVAL"],
        "AWAITING_USER_APPROVAL": ["USER_APPROVAL_RECEIVED", "USER_REJECTION_RECEIVED"],
        "USER_APPROVAL_RECEIVED": ["PLACING_ORDER"],
        "USER_REJECTION_RECEIVED": ["MEAL_PLANNING_STARTED"],
        "PLACING_ORDER": ["ORDER_CONFIRMED"],
        "ORDER_CONFIRMED": [""]
    }

    if new_state in state_transitions[current_state]:
        is_valid = True

    return is_valid
