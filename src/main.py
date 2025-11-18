import uuid
import asyncio

from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from typing import Any
from auto_nom_agent.agents import root_agent

load_dotenv()

# database url
db_url = "sqlite:///./db/auto_nom.db"
# setting db session service for persistent storage
session_service = DatabaseSessionService(db_url=db_url)

# Initialize the state
# in production this can be initialized with user preferences from the database
initial_state: dict[str, Any] = {
    "user_name": "Tony Stark",
    "user_id": "tony_h_stark",
    "user_dietary_preferences": ["pescatarian"],
    "user_allergies": ["gluten", "nuts"],
    "workflow_status": "PLANNING_MEAL",
    "meal_options": [],
    "meal_options_feedback": ""
}

APP_NAME = "auto_nom_agent"


async def call_agent_async(runner: Runner, user_id: str, session_id: str, query: types.Content) -> str:
    final_response_text: str = ""
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=query
    ):
        # Process each event and get the final response if available
        if event.is_final_response():
            if event.content and getattr(event.content, "parts", None):
                if event.content.parts and hasattr(event.content.parts[0], "text"):
                    text_part = getattr(event.content.parts[0], "text", None)
                    final_response_text = text_part or ""
                    print(f"Final Response: {final_response_text}")

    return final_response_text


async def main():
    user_id = initial_state["user_id"]
    # list sessions
    existing_sessions = await session_service.list_sessions(app_name=APP_NAME, user_id=user_id)

    # Use a local variable to avoid creating an unbound local name for SESSION_ID
    session_id = str(uuid.uuid4())

    # if existing session exists for the user load the fist one.
    # is it possible for a user to have more than one session? -- what would be the use case there.
    if existing_sessions and len(existing_sessions.sessions) > 0:
        session_id = existing_sessions.sessions[0].id
        session_id = existing_sessions.sessions[0].id
        print("🥳 Found existing session...")
    else:
        # this method creates and returns the newly created session
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
            state=initial_state
        )

    # Create a runner with the memory agent
    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    while True:
        # get user input
        user_input = input("You : ")

        # Check if user wants to exit
        if user_input.lower() in ["exit", "quit"]:
            print("Ending conversation. Your data has been saved to the database.")
            break

        # Process the user query through the agent
        query = types.Content(role="user", parts=[types.Part(text=user_input)])

        await call_agent_async(runner, user_id, session_id, query)


if __name__ == "__main__":
    asyncio.run(main())
