from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from typing import Any
from datetime import datetime
from contextlib import asynccontextmanager

# Local Imports
from src.agentic_workflows.auto_nom import AutoNom
from src.db import db_manager
from src.schema.users import UserProfile
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
    AutoNomLogger.health_check()
    return {"message": "Hello Auto Nom", "status": "healthy", "timestamp": datetime.now().isoformat()}

# --- User APIs ---


@app.get("/api/users")
async def list_users():
    try:
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
        AutoNomLogger.workflow_trigger_panel(user_id, meal_type)
        AutoNomLogger.workflow_mock_warning()

        # mock_response = {
        #     "session_id": f"session_{user_id}_{meal_type}_{int(datetime.now().timestamp())}",
        #     "status": "MOCK_TRIGGERED",
        #     "user_id": user_id,
        #     "meal_type": meal_type,
        #     "message": "Workflow triggered successfully (mock)",
        #     "timestamp": datetime.now().isoformat()
        # }

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
        # Do not call auto_nom.run() directly here; it returns an async generator.
        async def sse_event_generator():
            import json
            async for item in auto_nom.run():
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
        return StreamingResponse(sse_event_generator(), media_type="text/event-stream")


    except Exception as e:
        AutoNomLogger.workflow_trigger_error(user_id, meal_type, str(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger workflow: {str(e)}")


# @app.get("/api/sessions/{session_id}")
# async def get_session_status(session_id: str):
#     """
#     UI Polling Endpoint.
#     """
#     session = db_manager.get_session(session_id)
#     if not session:
#         raise HTTPException(status_code=404, detail="Session not found")
#     return session


# @app.post("/api/sessions/{session_id}/resume")
# async def resume_workflow(session_id: str, req: ResumeRequest):
#     """
#     PHASE 2: Handle User Input & Finish.
#     """
#     adk_session = adk.get_service(SessionService)

#     # 1. Inject User Choice into ADK State
#     await adk_session.set("workflow_status", "USER_APPROVAL_RECEIVED", session_id=session_id)
#     await adk_session.set("user_choice", req.choice, session_id=session_id)

#     # 2. Wake up Orchestrator (It handles Phase 2)
#     await adk.run_agent("MealOrchestrator", session_id=session_id)

#     # 3. Get Final Status
#     final_status = await adk_session.get("workflow_status", session_id=session_id)

#     # 4. Update DB
#     db_manager.update_session_status(session_id, final_status)

#     return {"status": final_status}


# catch all route everything to frontend
app.mount("/", StaticFiles(directory="./src/static", html=True), name="static")
