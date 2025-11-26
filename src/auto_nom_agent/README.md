# Agent Implementation Details


## Agent Workflow Status
* IDLE: Start of a fresh workflow
* MEAL_PLANNING_STARTED: The meal_planner is running its research (gathering info + scouting).
* MEAL_PLANNING_FAILED: The meal planner failed to generate the options because of downstream service failures
* MEAL_PLANNING_COMPLETE: The meal_planner has completed its research and updated state with available options.
* AWAITING_USER_APPROVAL: The workflow is paused. We have sent the 3 options to Telegram and are waiting for a reply.
* USER_APPROVAL_RECEIVED: The user has approved a meal from 3 options.
* USER_REJECTION_RECEIVED: The user has rejected all the options and so we need to plan the meals again.
* PLACING_ORDER: The user has replied. The OrderAgent is now running and communicating with the API.
* ORDER_CONFIRMED: The API has responded with success. The workflow is complete and ready to terminate.

## Agent Workflow State
### Default Example
```bash
    "user_name": "Tony Stark",
    "user_id": "tony_h_stark",
    "user_dietary_preferences": ["pescatarian"],
    "user_allergies": ["gluten", "nuts"],
    "workflow_status": "IDLE",
    "meal_options": [],
    "user_choice": "",
    "user_feedback": ""
```