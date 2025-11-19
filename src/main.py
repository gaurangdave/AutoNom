import uuid
import asyncio

from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.genai import types
from typing import Any
from auto_nom_agent.agents import root_agent

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.table import Table
from rich.live import Live
from rich.spinner import Spinner
from rich import box
import json
load_dotenv()

console = Console()

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
    "workflow_status": "INITIALIZE",
    "meal_options": [],
    "user_feedback": "",
    "user_choice": ""
}

APP_NAME = "auto_nom_agent"


async def call_agent_async(runner: Runner, user_id: str, session_id: str, query: types.Content) -> str:
    final_response_text: str = ""

    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=query
    ):
        agent_name = event.author if hasattr(event, "author") else "System"

        # Safely obtain parts (handles the case where parts may be None)
        parts = []
        if getattr(event, "content", None) is not None:
            parts: Any = getattr(event.content, "parts", None) or []

        for part in parts:
            if hasattr(part, "text") and part.text:
                text = part.text

                if event.is_final_response():
                    console.print(Panel(
                        Markdown(text),
                        title=f"[bold green]🤖 {agent_name}[/bold green]",
                        border_style="green",
                        box=box.ROUNDED
                    ))
                    final_response_text = text
                else:
                    # Intermediate thinking
                    console.print(Panel(
                        text,
                        title=f"[bold cyan]💭 {agent_name} (thinking)[/bold cyan]",
                        border_style="cyan",
                        box=box.ROUNDED
                    ))

             # Handle function calls
            elif hasattr(part, "function_call"):
                func_call = getattr(part,"function_call", {})
                func_name = getattr(func_call,"name", "Unknown")
                # Parse arguments
                try:
                    args = getattr(func_call, "args", {})
                    args_dict = json.loads(args) if isinstance(
                        args, str) else dict(args)
                    
                    args_formatted = json.dumps(args_dict, indent=2)
                except:
                    args_formatted = str("")

                console.print(Panel(
                    f"[bold yellow]Function:[/bold yellow] {func_name}\n\n"
                    f"[bold yellow]Arguments:[/bold yellow]\n{args_formatted}",
                    title=f"[bold yellow]🔧 {agent_name} - Tool Call[/bold yellow]",
                    border_style="yellow",
                    box=box.ROUNDED
                ))

            # Handle function responses
            elif hasattr(part, "function_response"):
                func_response = part.function_response

                # Parse response
                try:
                    response_dict: Any = json.loads(func_response.response) if isinstance(
                        func_response.response, str) else dict(func_response.response)
                    response_formatted = json.dumps(
                        response_dict, indent=2)
                except:
                    response_formatted = str(func_response.response)

                console.print(Panel(
                    f"[bold magenta]Function:[/bold magenta] {func_response.name}\n\n"
                    f"[bold magenta]Response:[/bold magenta]\n{response_formatted}",
                    title=f"[bold magenta]✅ Tool Response[/bold magenta]",
                    border_style="magenta",
                    box=box.ROUNDED
                ))

    return final_response_text


async def display_session_info(session_service:DatabaseSessionService, app_name: str, user_id: str, session_id: str):
    """Display current session state"""
    session = await session_service.get_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id
    )

    if session and session.state:
        state_table = Table(title="Current Session State", box=box.ROUNDED)
        state_table.add_column("Key", style="cyan")
        state_table.add_column("Value", style="green")

        for key, value in session.state.items():
            # Format complex values
            if isinstance(value, (dict, list)):
                value_str = json.dumps(value, indent=2)
            else:
                value_str = str(value)

            # Truncate long values
            if len(value_str) > 100:
                value_str = value_str[:100] + "..."

            state_table.add_row(key, value_str)

        console.print(state_table)

def display_welcome():
    """Display welcome banner"""
    welcome_text = """
    # 🍽️  AutoNom - Your AI Meal Planning Assistant
    
    I'll help you find the perfect restaurants and meals based on your preferences!
    
    **Commands:**
    - Type your message to chat
    - `/state` - View current session state
    - `/clear` - Clear screen
    - `/exit` or `/quit` - Exit the application
    """
    console.print(Panel(
        Markdown(welcome_text),
        title="[bold blue]Welcome![/bold blue]",
        border_style="blue",
        box=box.DOUBLE
    ))

async def main():
    user_id = initial_state["user_id"]
    
    # Clear screen and show welcome
    console.clear()
    display_welcome()
    
    # list sessions
    existing_sessions = await session_service.list_sessions(app_name=APP_NAME, user_id=user_id)

    # Use a local variable to avoid creating an unbound local name for SESSION_ID
    session_id = str(uuid.uuid4())

    # if existing session exists for the user load the fist one.
    # is it possible for a user to have more than one session? -- what would be the use case there.
    if existing_sessions and len(existing_sessions.sessions) > 0:
        session_id = existing_sessions.sessions[0].id
        session_id = existing_sessions.sessions[0].id
        console.print(f"[green]✓[/green] Loaded existing session: [cyan]{session_id[:8]}...[/cyan]")
    else:
    # this method creates and returns the newly created session
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
            state=initial_state
        )
        console.print(f"[green]✓[/green] Created new session: [cyan]{session_id[:8]}...[/cyan]")


    # Create a runner with the memory agent
    console.print()
    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    while True:
        # get user input
        console.print()
        user_input = console.input("[bold blue]You:[/bold blue] ")

        # Check if user wants to exit
        if user_input.lower() in ["/exit", "/quit"]:
            console.print(Panel(
                "[green]Thanks for using AutoNom! Your session has been saved.[/green]",
                border_style="green"
            ))
            break

        elif user_input.lower() == "/clear":
            console.clear()
            display_welcome()
            continue
        
        elif user_input.lower() == "/state":
            await display_session_info(session_service, APP_NAME, user_id, session_id)
            continue
        
        elif user_input.lower() == "/help":
            display_welcome()
            continue
        
        elif not user_input.strip():
            continue
        
        # Process the user query
        console.print()
        with console.status("[bold green]Thinking...[/bold green]", spinner="dots"):
            query = types.Content(role="user", parts=[types.Part(text=user_input)])
            await call_agent_async(runner, user_id, session_id, query)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Session interrupted. Goodbye![/yellow]")
