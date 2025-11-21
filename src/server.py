from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from typing import Any
from datetime import datetime
from contextlib import asynccontextmanager

# Local Imports
from src.agentic_workflows.auto_nom import AutoNom
from src.db import db_manager
from src.schema.users import ResumeRequest, UserProfile
from src.utils.logger import AutoNomLogger

# Lifespan context manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db_manager.init_db()
    AutoNomLogger.startup_message()

    yield

    # Shutdown
    AutoNomLogger.shutdown_message()

app = FastAPI(title="Auto-Nom API", version="1.0.0", lifespan=lifespan)

# Mount static files
app.mount("/static", StaticFiles(directory="./src/static"), name="static")


@app.get("/api/")
async def root():
    AutoNomLogger.api_called_panel("GET", "/api/")
    AutoNomLogger.health_check()
    return {"message": "Hello Auto Nom", "status": "healthy", "timestamp": datetime.now().isoformat()}

# --- User APIs ---


@app.get("/api/users")
async def list_users():
    try:
        AutoNomLogger.api_called_panel("GET", "/api/users")
        AutoNomLogger.fetching_users()
        users = db_manager.get_all_users()
        AutoNomLogger.users_retrieved_table(users)
        return users
    except Exception as e:
        AutoNomLogger.user_retrieval_error(str(e))
        raise HTTPException(
            status_code=500, detail="Internal server error while retrieving users")


@app.post("/api/users")
async def create_user(user: UserProfile) -> dict[str, Any]:
    try:
        AutoNomLogger.api_called_panel(
            "POST",
            "/api/users",
            params={"user_id": user.id, "name": user.name,
                    "preferences_count": len(user.preferences)}
        )
        AutoNomLogger.user_operation_panel_from_profile(user)

        db_manager.upsert_user(user)

        AutoNomLogger.user_operation_success(user.name, user.id)
        return {"status": "success", "user_id": user.id, "timestamp": datetime.now().isoformat()}

    except Exception as e:
        AutoNomLogger.user_operation_error(user.id, str(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to create/update user: {str(e)}")

# --- Workflow APIs ---


@app.post("/api/users/{user_id}/meals/{meal_type}/trigger")
async def trigger_workflow(user_id: str, meal_type: str):
    try:
        AutoNomLogger.api_called_panel(
            "POST",
            f"/api/users/{user_id}/meals/{meal_type}/trigger",
            params={"user_id": user_id, "meal_type": meal_type},
            user_id=user_id
        )
        AutoNomLogger.workflow_trigger_panel(user_id, meal_type)
        # step 1: Read preferences, allergies & special_instructions from database
        AutoNomLogger.log_info("Step 1: Get User Details")
        current_user = db_manager.get_user(user_id=user_id)
        if current_user:
            AutoNomLogger.log_debug(
                f"Found user: {current_user.id}",
                "USER_DETAILS",
                **current_user.model_dump()
            )
        else:
            AutoNomLogger.log_error(
                f"Step 1 Failed - Cannot find user with ID {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # TODO: Add a logic to save the started session from preventing multiple runs
        auto_nom = AutoNom(current_user, meal_type=meal_type)
        user_input = f"Plan a {meal_type} for {current_user.name}"

        # Use the new SSE event stream method from AutoNom class
        return StreamingResponse(
            auto_nom.get_sse_event_stream(user_input),
            media_type="text/event-stream"
        )
    except Exception as e:
        AutoNomLogger.workflow_trigger_error(user_id, meal_type, str(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger workflow: {str(e)}")


@app.post("/api/sessions/{session_id}/resume")
async def resume_workflow(session_id: str, req: ResumeRequest):
    """
    PHASE 2: Handle User Input & Finish.
    """
    try:
        AutoNomLogger.api_called_panel(
            "POST",
            f"/api/sessions/{session_id}/resume",
            params={"choice": req.choice},
        )
        
        # step 1: Get the user_id for the given session_id
        session = db_manager.get_session_by_id(session_id=session_id)
        
        if not session:
            AutoNomLogger.log_error(f"Cannot fine session for {session_id}", "RESUME_WORKFLOW")
            raise HTTPException(status_code=404, detail=f"Cannot fine session for {session_id}")
        
        user_id = session.user_id
        
        # step 2: Load user preferences from user id
        current_user = db_manager.get_user(user_id=user_id)
        if current_user:
            AutoNomLogger.log_debug(
                f"Found user: {current_user.id}",
                "USER_DETAILS",
                **current_user.model_dump()
            )
        else:
            AutoNomLogger.log_error(
                f"Step 1 Failed - Cannot find user with ID {user_id}")
            raise HTTPException(status_code=404, detail="User not found")

        # step 3: trigger the agent with user input
        # TODO: Add a logic to save the started session from preventing multiple runs
        auto_nom = AutoNom(current_user, session_id=session_id)
        user_input = f"{req.choice}"

        # Use the new SSE event stream method from AutoNom class
        return StreamingResponse(
            auto_nom.get_sse_event_stream(user_input),
            media_type="text/event-stream"
        )
     
    except Exception as e:
        AutoNomLogger.log_error(
            f"Failed to resume workflow for session : {session_id}", "RESUME_WORKFLOW", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to resume workflow: {str(e)}")




@app.get("/api/sessions/{session_id}/state/{state_key}")
async def get_session_state_value(session_id: str, state_key: str) -> dict[str, Any]:
    """
    Get a specific state value from a session by session ID and state key.
    """
    try:
        AutoNomLogger.api_called_panel(
            "GET",
            f"/api/sessions/{session_id}/state/{state_key}",
            params={"session_id": session_id, "state_key": state_key}
        )
        
        state_value = db_manager.get_session_state_val(session_id, state_key)
        
        if state_value is None:
            # Check if session exists at all
            session = db_manager.get_session_by_id(session_id)
            if not session:
                AutoNomLogger.log_error(f"Session not found: {session_id}", "GET_SESSION_STATE")
                raise HTTPException(status_code=404, detail="Session not found")
            else:
                AutoNomLogger.log_error(f"State key '{state_key}' not found in session {session_id}", "GET_SESSION_STATE")
                raise HTTPException(status_code=404, detail=f"State key '{state_key}' not found")
        
        AutoNomLogger.log_info(f"Retrieved state value for key '{state_key}' from session {session_id}", "GET_SESSION_STATE")
        return {
            "session_id": session_id,
            "state_key": state_key,
            "value": state_value,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        AutoNomLogger.log_error(f"Failed to get state value for session {session_id}: {str(e)}", "GET_SESSION_STATE")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve state value: {str(e)}"
        )


# catch all route everything to frontend
app.mount("/", StaticFiles(directory="./src/static", html=True), name="static")
