
import uuid

from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.adk.events import Event
from google.genai import types
from typing import Any
from src.auto_nom_agent.agents import root_agent

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich import box


from src.db import db_manager
from src.schema.users import UserProfile
from src.utils.logger import AutoNomLogger
console = Console()


class AutoNom():
    def __init__(self, user: UserProfile, meal_type: str = "", session_id: str = ""):
        self._app_name = "auto_nom_agent"
        self.user = user
        self.meal_type = meal_type
        self.initial_state: dict[str, Any] = {
            "user_name": user.name,
            "user_id": user.id,
            "user_dietary_preferences": ",\n".join(user.preferences) + "\n" + user.special_instructions,
            "user_allergies": user.allergies,
            "workflow_status": "INITIALIZE",
            "meal_options": [],
            "user_feedback": "",
            "user_choice": []
        }
        self.session_id = session_id if session_id else str(uuid.uuid4())

        AutoNomLogger.log_info(
            f"Initialized AutoNom for user {self.user.id}, with session : {self.session_id}")
        # private properties # database url
        self.__db_url = "sqlite:///./src/db/data/autonom.db"
        # setting db session service for persistent storage
        self.__session_service = DatabaseSessionService(db_url=self.__db_url)

    def __print_function_calls(self, agent_name: str, event: Event):
        """Helper function to print function call events

        Args:
            agent_name (str): _description_
            event (Event): _description_
        """
        calls = event.get_function_calls()
        if calls:
            # Event is a tool call request
            response: dict[str, Any] = {
                "type": "ToolCall",
                "calls": []
            }
            for call in calls:
                tool_name = call.name
                arguments = call.args  # This is usually a dictionary
                console.print(Panel(
                    f"[bold yellow]Function:[/bold yellow] {tool_name}\n\n"
                    f"[bold yellow]Arguments:[/bold yellow]\n{arguments}",
                    title=f"[bold yellow]🔧 {agent_name} - Tool Call[/bold yellow]",
                    border_style="yellow",
                    box=box.ROUNDED
                ))
                response["calls"].append({
                    "name": tool_name,
                    "arguments": arguments
                })
            return response
        return None

    def __print_function_responses(self, agent_name: str, event: Event):
        """Helper function to print function call response events

        Args:
            agent_name (str): _description_
            event (Event): _description_
        """
        responses = event.get_function_responses()
        if responses:
            response: dict[str, Any] = {
                "type": "ToolResponse",
                "responses": []
            }
            for resp in responses:
                tool_name = resp.name
                result_dict = resp.response
                console.print(Panel(
                    f"[bold magenta]Function:[/bold magenta] {tool_name}\n\n"
                    f"[bold magenta]Response:[/bold magenta]\n{result_dict}",
                    title=f"[bold magenta]✅ Tool Response[/bold magenta]",
                    border_style="magenta",
                    box=box.ROUNDED
                ))
                response["responses"].append({
                    "name": tool_name,
                    "response": result_dict
                })
            return response
        return None

    def __print_conversation(self, agent_name: str, event: Event):
        response: dict[str, Any] = {
            "type": "TextResponse",
            "isFinalResponse": False,
            "text": ""
        }

        if event.content and event.content.parts:
            if event.content.parts[0].text:
                text = event.content.parts[0].text
                if event.partial:
                    print("  Type: Streaming Text Chunk")
                else:
                    print("  Type: Complete Text Message")
                if event.is_final_response():
                    console.print(Panel(
                        Markdown(text),
                        title=f"[bold green]🤖 {agent_name}[/bold green]",
                        border_style="green",
                        box=box.ROUNDED
                    ))
                    response["text"] = text
                    response["isFinalResponse"] = True
                else:
                    # Intermediate thinking
                    console.print(Panel(
                        text,
                        title=f"[bold cyan]💭 {agent_name} (thinking)[/bold cyan]",
                        border_style="cyan",
                        box=box.ROUNDED
                    ))
                    response["text"] = text
                    response["isFinalResponse"] = False

            return response

    async def __get_or_create_session(self):
        existing_sessions = await self.__session_service.list_sessions(app_name=self._app_name, user_id=self.user.id)
        if existing_sessions and len(existing_sessions.sessions) > 0 and existing_sessions.sessions[0].id == self.session_id:
            session_id = existing_sessions.sessions[0].id
            self.__session = existing_sessions.sessions[0]
            AutoNomLogger.log_info(
                f"Loaded existing session:{session_id[:8]}...")
        else:
            AutoNomLogger.log_info(
                f"Creating new session:{self.session_id[:8]}...")

            self.__session = await self.__session_service.create_session(
                app_name=self._app_name,
                user_id=self.user.id,
                session_id=self.session_id,
                state=self.initial_state
            )

    async def run(self, user_input:str):
        # Step 1 : Create a new session
        await self.__get_or_create_session()

        # Step 2 : Create a new Runner instance
        self.runner = Runner(
            agent=root_agent,
            app_name=self._app_name,
            session_service=self.__session_service,
        )

        # TODO: Update this prompt to a improve the performance
        AutoNomLogger.log_info(f"Starting session : {self.session_id}")

        # Step 3: Create a user query
        # user_input = f"Plan a {self.meal_type} for {self.user.name}"
        query = types.Content(role="user", parts=[
            types.Part(text=user_input)])

        # Step 4: Run the agent
        async for event in self.runner.run_async(
            user_id=self.user.id, session_id=self.session_id, new_message=query
        ):
            agent_name = event.author if hasattr(event, "author") else "System"
            response = self.__print_function_calls(
                agent_name=agent_name, event=event)

            if not response:
                response = self.__print_function_responses(
                    agent_name=agent_name, event=event)

            if not response:
                response = self.__print_conversation(
                    agent_name=agent_name, event=event)

            if response:
                workflow_status = db_manager.get_session_state_val(self.session_id, "workflow_status")
                AutoNomLogger.log_debug(f"Workflow Status in DB {workflow_status}")
                response["workflow_status"] = workflow_status
                
            yield (response)

    async def get_sse_event_stream(self, user_input: str):
        """Generate Server-Sent Events stream for real-time communication with client.
        
        Args:
            user_input (str): The input message to process
            
        Yields:
            str: SSE formatted data events
        """
        import json
        async for item in self.run(user_input=user_input):
            if item is None:
                continue
            try:
                data = json.dumps(item)
            except Exception:
                data = json.dumps({"data": str(item)})
            # SSE format: each message prefixed with "data: " and separated by a blank line
            yield f"data: {data}\n\n"
        # final keep-alive/termination event (optional)
        yield "event: done\ndata: {}\n\n"

