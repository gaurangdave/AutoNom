from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from typing import Any
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio

# Local Imports
from src.agentic_workflows.auto_nom import AutoNom
from src.db import db_manager
from src.schema.users import ResumeRequest, UserProfile
from utils.logger import ServiceLogger
from rich.console import Console
from rich.table import Table
from rich import box

console = Console()

# Lifespan context manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db_manager.init_db()
    ServiceLogger.startup_message("Auto-Nom API", port=8000)
    ServiceLogger.log_success("Database initialized successfully")

    yield

    # Shutdown
    ServiceLogger.shutdown_message("Auto-Nom API")

app = FastAPI(title="Auto-Nom API", version="1.0.0", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="./src/static"), name="static")


@app.get("/api/")
async def root():
    ServiceLogger.api_called_panel("GET", "/api/")
    ServiceLogger.health_check()
    return {"message": "Hello Auto Nom", "status": "healthy", "timestamp": datetime.now().isoformat()}

# --- User APIs ---


@app.get("/api/users")
async def list_users():
    try:
        ServiceLogger.api_called_panel("GET", "/api/users")
        ServiceLogger.log_info("Fetching all users from database...", "API")
        users = db_manager.get_all_users()
        
        # Display users in a formatted table
        table = Table(title="Users Retrieved", box=box.MINIMAL)
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="magenta")
        table.add_column("Preferences", style="green")
        table.add_column("Allergies", style="red")
        
        for user in users:
            preferences_str = ", ".join(user.preferences)
            allergies_str = ", ".join(user.allergies)
            table.add_row(
                user.id,
                user.name,
                preferences_str or "None",
                allergies_str or "None"
            )
        
        console.print(table)
        ServiceLogger.log_success(f"Successfully retrieved {len(users)} users")
        return users
    except Exception as e:
        ServiceLogger.log_error("Error retrieving users", "API", error=e)
        raise HTTPException(
            status_code=500, detail="Internal server error while retrieving users")


@app.post("/api/users")
async def create_user(user: UserProfile) -> UserProfile:
    try:
        ServiceLogger.api_called_panel(
            "POST",
            "/api/users",
            params={"user_id": user.id, "name": user.name,
                    "preferences_count": len(user.preferences)}
        )
        ServiceLogger.log_panel(
            "👤 User Operation",
            f"[bold yellow]Creating/Updating User[/bold yellow]\n"
            f"[cyan]ID:[/cyan] {user.id}\n"
            f"[cyan]Name:[/cyan] {user.name}\n"
            f"[cyan]Preferences:[/cyan] {', '.join(user.preferences) if user.preferences else 'None'}\n"
            f"[cyan]Allergies:[/cyan] {', '.join(user.allergies) if user.allergies else 'None'}\n"
            f"[cyan]Schedule Days:[/cyan] {', '.join(user.schedule.get('days', [])) if user.schedule else 'None'}\n"
            f"[cyan]Meal Slots:[/cyan] {len(user.schedule.get('meals', [])) if user.schedule else 0} meals\n"
            f"[cyan]Special Instructions:[/cyan] {user.special_instructions or 'None'}",
            "blue"
        )

        db_manager.upsert_user(user)

        ServiceLogger.log_success(f"User '{user.name}' (ID: {user.id}) created/updated successfully!", "USER")
        # Return the full user profile instead of just a status message
        return user

    except Exception as e:
        ServiceLogger.log_error(f"Failed to create/update user {user.id}", "USER", error=e)
        raise HTTPException(
            status_code=500, detail=f"Failed to create/update user: {str(e)}")

# --- Workflow APIs ---


@app.post("/api/users/{user_id}/meals/{meal_type}/trigger", response_model=None)
async def trigger_workflow(user_id: str, meal_type: str, streaming: bool = False) -> dict[str, Any] | StreamingResponse:
    try:
        ServiceLogger.api_called_panel(
            "POST",
            f"/api/users/{user_id}/meals/{meal_type}/trigger",
            params={"user_id": user_id, "meal_type": meal_type, "streaming": streaming},
            user_id=user_id
        )
        ServiceLogger.log_panel(
            "🍽️ Workflow Trigger",
            f"[bold cyan]Triggering Meal Workflow[/bold cyan]\n"
            f"[yellow]User ID:[/yellow] {user_id}\n"
            f"[yellow]Meal Type:[/yellow] {meal_type}\n"
            f"[yellow]Timestamp:[/yellow] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "cyan"
        )
        # step 1: Read preferences, allergies & special_instructions from database
        ServiceLogger.log_info("Step 1: Get User Details")
        current_user = db_manager.get_user(user_id=user_id)
        if current_user:
            ServiceLogger.log_debug(
                f"Found user: {current_user.id}",
                "USER_DETAILS",
                **current_user.model_dump()
            )
        else:
            ServiceLogger.log_error(
                f"Step 1 Failed - Cannot find user with ID {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # TODO: Add a logic to save the started session from preventing multiple runs
        auto_nom = AutoNom(current_user, meal_type=meal_type)
        user_input = f"Plan a {meal_type} for {current_user.name}"

        # Return based on streaming flag
        if streaming:
            # Use the new SSE event stream method from AutoNom class
            return StreamingResponse(
                auto_nom.get_sse_event_stream(user_input),
                media_type="text/event-stream"
            )
        else:
            # Fire and forget: start workflow in background
            async def run_workflow():
                async for _ in auto_nom.run(user_input=user_input):
                    pass  # Consume all events
            
            # Start the workflow but don't wait for it
            asyncio.create_task(run_workflow())
            
            # Return immediately with session info
            return {
                "session_id": auto_nom.session_id,
                "workflow_status": "STARTED",
                "user_id": user_id,
                "meal_type": meal_type,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        ServiceLogger.log_error(f"Workflow trigger failed for user {user_id}, meal: {meal_type}", "WORKFLOW", error=e)
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger workflow: {str(e)}")


@app.post("/api/sessions/{session_id}/resume", response_model=None)
async def resume_workflow(session_id: str, req: ResumeRequest, streaming: bool = False) -> dict[str, Any] | StreamingResponse:
    """
    PHASE 2: Handle User Input & Finish.
    """
    try:
        ServiceLogger.api_called_panel(
            "POST",
            f"/api/sessions/{session_id}/resume",
            params={"choice": req.choice, "streaming": streaming},
        )
        
        # step 1: Get the user_id for the given session_id
        session = db_manager.get_session_by_id(session_id=session_id)
        
        if not session:
            ServiceLogger.log_error(f"Cannot fine session for {session_id}", "RESUME_WORKFLOW")
            raise HTTPException(status_code=404, detail=f"Cannot fine session for {session_id}")
        
        user_id = session.user_id
        
        # step 2: Load user preferences from user id
        current_user = db_manager.get_user(user_id=user_id)
        if current_user:
            ServiceLogger.log_debug(
                f"Found user: {current_user.id}",
                "USER_DETAILS",
                **current_user.model_dump()
            )
        else:
            ServiceLogger.log_error(
                f"Step 1 Failed - Cannot find user with ID {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # step 3: trigger the agent with user input
        # TODO: Add a logic to save the started session from preventing multiple runs
        auto_nom = AutoNom(current_user, session_id=session_id)
        user_input = f"{req.choice}"

        # Return based on streaming flag
        if streaming:
            # Use the new SSE event stream method from AutoNom class
            return StreamingResponse(
                auto_nom.get_sse_event_stream(user_input),
                media_type="text/event-stream"
            )
        else:
            # Fire and forget: start workflow in background
            async def run_workflow():
                async for _ in auto_nom.run(user_input=user_input):
                    pass  # Consume all events
            
            # Start the workflow but don't wait for it
            asyncio.create_task(run_workflow())
            
            # Get current workflow status
            workflow_status = db_manager.get_session_state_val(session_id, "workflow_status")
            
            # Return immediately with session info
            return {
                "session_id": session_id,
                "workflow_status": workflow_status or "PROCESSING",
                "user_id": user_id,
                "user_choice": req.choice,
                "timestamp": datetime.now().isoformat()
            }
     
    except Exception as e:
        ServiceLogger.log_error(
            f"Failed to resume workflow for session : {session_id}", "RESUME_WORKFLOW", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to resume workflow: {str(e)}")





@app.get("/api/sessions/{session_id}/state/{state_key}")
async def get_session_state_value(session_id: str, state_key: str) -> dict[str, Any]:
    """
    Get a specific state value from a session by session ID and state key.
    """
    try:
        ServiceLogger.api_called_panel(
            "GET",
            f"/api/sessions/{session_id}/state/{state_key}",
            params={"session_id": session_id, "state_key": state_key}
        )
        
        state_value = db_manager.get_session_state_val(session_id, state_key)
        
        if state_value is None:
            # Check if session exists at all
            session = db_manager.get_session_by_id(session_id)
            if not session:
                ServiceLogger.log_error(f"Session not found: {session_id}", "GET_SESSION_STATE")
                raise HTTPException(status_code=404, detail="Session not found")
            else:
                ServiceLogger.log_error(f"State key '{state_key}' not found in session {session_id}", "GET_SESSION_STATE")
                raise HTTPException(status_code=404, detail=f"State key '{state_key}' not found")
        
        ServiceLogger.log_info(f"Retrieved state value for key '{state_key}' from session {session_id}", "GET_SESSION_STATE")
        return {
            "session_id": session_id,
            "state_key": state_key,
            "value": state_value,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        ServiceLogger.log_error(f"Failed to get state value for session {session_id}: {str(e)}", "GET_SESSION_STATE")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve state value: {str(e)}"
        )


@app.get("/api/users/{user_id}/sessions")
async def get_user_sessions(user_id: str) -> dict[str, Any]:
    """
    Get all sessions for a given user_id.
    Returns all sessions (both active and completed) for the specified user.
    """
    try:
        ServiceLogger.api_called_panel(
            "GET",
            f"/api/users/{user_id}/sessions",
            params={"user_id": user_id}
        )
        
        # Check if user exists
        user = db_manager.get_user(user_id=user_id)
        if not user:
            ServiceLogger.log_error(f"User not found: {user_id}", "GET_USER_SESSIONS")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get all sessions for the user
        all_sessions: list[Any] = db_manager.get_user_sessions("auto_nom_agent", user_id)
        
        # Format the response with session states
        sessions_data: list[dict[str, Any]] = []
        for session in all_sessions:
            # treat session as dynamic Any for typing purposes
            s: Any = session
            sessions_data.append({
                "session_id": s.id,
                "state": s.state,
                "create_time": s.create_time.isoformat(),
                "update_time": s.update_time.isoformat()
            })
        
        ServiceLogger.log_info(f"Retrieved {len(all_sessions)} sessions for user {user_id}", "GET_USER_SESSIONS")
        return {
            "user_id": user_id,
            "sessions_count": len(all_sessions),
            "sessions": sessions_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        ServiceLogger.log_error(f"Failed to get sessions for user {user_id}: {str(e)}", "GET_USER_SESSIONS")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve sessions: {str(e)}"
        )


@app.get("/api/users/{user_id}/active-sessions")
async def get_user_active_sessions(user_id: str) -> dict[str, Any]:
    """
    Get all active session IDs for a given user_id.
    An active session is any session where state.workflow_status is not 'ORDER_CONFIRMED'.
    Returns only the session IDs for active sessions.
    """
    try:
        ServiceLogger.api_called_panel(
            "GET",
            f"/api/users/{user_id}/active-sessions",
            params={"user_id": user_id}
        )
        
        # Check if user exists
        user = db_manager.get_user(user_id=user_id)
        if not user:
            ServiceLogger.log_error(f"User not found: {user_id}", "GET_ACTIVE_SESSIONS")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get active sessions for the user
        active_sessions: list[Any] = db_manager.get_active_user_sessions("auto_nom_agent", user_id)
        
        # Extract only session IDs
        session_ids: list[str] = []
        for session in active_sessions:
            # treat session as dynamic Any for typing purposes
            s: Any = session
            session_ids.append(s.id)
        
        ServiceLogger.log_info(f"Retrieved {len(active_sessions)} active sessions for user {user_id}", "GET_ACTIVE_SESSIONS")
        return {
            "user_id": user_id,
            "active_sessions_count": len(active_sessions),
            "session_ids": session_ids,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        ServiceLogger.log_error(f"Failed to get active sessions for user {user_id}: {str(e)}", "GET_ACTIVE_SESSIONS")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve active sessions: {str(e)}"
        )


@app.get("/api/users/{user_id}/active-sessions/{session_id}/state")
async def get_user_active_session_state(user_id: str, session_id: str) -> dict[str, Any]:
    """
    Get the state for a specific active session by user_id and session_id.
    Returns the complete session state including workflow_status and other state data.
    """
    try:
        # ServiceLogger.api_called_panel(
        #     "GET",
        #     f"/api/users/{user_id}/active-sessions/{session_id}/state",
        #     params={"user_id": user_id, "session_id": session_id}
        # )
        
        # Check if user exists
        user = db_manager.get_user(user_id=user_id)
        if not user:
            ServiceLogger.log_error(f"User not found: {user_id}", "GET_ACTIVE_SESSION_STATE")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get the specific session
        session = db_manager.get_session_by_id(session_id=session_id)
        if not session:
            ServiceLogger.log_error(f"Session not found: {session_id}", "GET_ACTIVE_SESSION_STATE")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Verify session belongs to the user
        if session.user_id != user_id:
            ServiceLogger.log_error(f"Session {session_id} does not belong to user {user_id}", "GET_ACTIVE_SESSION_STATE")
            raise HTTPException(status_code=403, detail="Session does not belong to user")
        
        ServiceLogger.log_info(f"Retrieved state for session {session_id} for user {user_id}", "GET_ACTIVE_SESSION_STATE")
        return {
            "user_id": user_id,
            "session_id": session_id,
            "state": session.state,
            "create_time": session.create_time.isoformat(),
            "update_time": session.update_time.isoformat(),
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        ServiceLogger.log_error(f"Failed to get state for session {session_id}: {str(e)}", "GET_ACTIVE_SESSION_STATE")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve session state: {str(e)}"
        )


@app.post("/api/sessions/{session_id}/status", response_model=None)
async def check_order_status(session_id: str, streaming: bool = False) -> dict[str, Any] | StreamingResponse:
    """
    Ping the agent to check the current status of an order.
    Similar to resume_workflow but specifically asks the agent for status update.
    """
    try:
        ServiceLogger.api_called_panel(
            "POST",
            f"/api/sessions/{session_id}/status",
            params={"session_id": session_id, "streaming": streaming}
        )
        
        # Step 1: Get the session to find the user_id
        session = db_manager.get_session_by_id(session_id=session_id)
        
        if not session:
            ServiceLogger.log_error(f"Cannot find session for {session_id}", "CHECK_ORDER_STATUS")
            raise HTTPException(status_code=404, detail=f"Cannot find session for {session_id}")
        
        user_id = session.user_id
        
        # Step 2: Load user preferences from user id
        current_user = db_manager.get_user(user_id=user_id)
        if not current_user:
            ServiceLogger.log_error(f"Cannot find user with ID {user_id}", "CHECK_ORDER_STATUS")
            raise HTTPException(status_code=404, detail="User not found")
        
        ServiceLogger.log_debug(
            f"Found user: {current_user.id}",
            "CHECK_ORDER_STATUS",
            **current_user.model_dump()
        )
        
        # Step 3: Initialize the agent with the existing session
        auto_nom = AutoNom(current_user, session_id=session_id)
        
        # Ask the agent specifically about the order status
        user_input = "What is the current status of my order?"
        
        # Return based on streaming flag
        if streaming:
            return StreamingResponse(
                auto_nom.get_sse_event_stream(user_input),
                media_type="text/event-stream"
            )
        else:
            # Fire and forget: start workflow in background
            async def run_status_check():
                async for _ in auto_nom.run(user_input=user_input):
                    pass  # Consume all events
            
            # Start the status check but don't wait for it
            asyncio.create_task(run_status_check())
            
            # Get current workflow status
            workflow_status = db_manager.get_session_state_val(session_id, "workflow_status")
            
            # Return immediately with session info
            return {
                "session_id": session_id,
                "workflow_status": workflow_status or "CHECKING_STATUS",
                "user_id": user_id,
                "action": "status_check",
                "timestamp": datetime.now().isoformat()
            }
    
    except HTTPException:
        raise
    except Exception as e:
        ServiceLogger.log_error(
            f"Failed to check order status for session: {session_id}", "CHECK_ORDER_STATUS", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to check order status: {str(e)}"
        )


@app.delete("/api/sessions")
async def delete_all_sessions() -> dict[str, Any]:
    """
    Delete all sessions from the database.
    Returns the number of sessions deleted.
    """
    try:
        ServiceLogger.api_called_panel(
            "DELETE",
            "/api/sessions",
            params={}
        )
        
        ServiceLogger.log_panel(
            "🗑️ Delete All Sessions",
            "[bold red]Deleting all sessions from database[/bold red]",
            "red"
        )
        
        # Delete all sessions
        deleted_count = db_manager.delete_all_sessions()
        
        ServiceLogger.log_success(f"Successfully deleted {deleted_count} sessions", "DELETE_SESSIONS")
        return {
            "deleted_count": deleted_count,
            "message": f"Successfully deleted {deleted_count} sessions",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        ServiceLogger.log_error(f"Failed to delete all sessions: {str(e)}", "DELETE_SESSIONS")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete all sessions: {str(e)}"
        )




# catch all route everything to frontend
app.mount("/", StaticFiles(directory="./src/static", html=True), name="static")
