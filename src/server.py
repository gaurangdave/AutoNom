from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from typing import Any


# Local Imports
from src.db import db_manager
from src.schema.users import UserProfile

app = FastAPI(app="Auto-Nom API")

# Mount static files
app.mount("/static", StaticFiles(directory="./src/static"), name="static")

# Initialize DB on startup
db_manager.init_db()


@app.get("/api/")
async def root():
    return {"message": "Hello Auto Nom"}

# --- User APIs ---


@app.get("/api/users")
async def list_users():
    return db_manager.get_all_users()


@app.post("/api/users")
async def create_user(user: UserProfile) -> dict[str, Any]:
    db_manager.upsert_user(
        user.id, user.name, user.preferences, user.allergies)
    return {"status": "success", "user_id": user.id}

# --- Workflow APIs ---
# @app.post("/api/users/{user_id}/meals/{meal_type}/trigger")
# async def trigger_workflow(user_id: str, meal_type: str):
#     """
#     PHASE 1: Start the Agent.
#     Run until it pauses at 'AWAITING_USER_APPROVAL'.
#     """
#     session_id = str(uuid.uuid4())

#     # 1. Create DB Entry
#     db_manager.create_session(session_id, user_id, meal_type)

#     # 2. Init ADK Session
#     adk_session = adk.get_service(SessionService)
#     await adk_session.set("workflow_status", "INITIALIZE", session_id=session_id)
#     # Context for agent
#     await adk_session.set("user_id", user_id, session_id=session_id)

#     # 3. Run Orchestrator (It handles Phase 1)
#     await adk.run_agent("MealOrchestrator", session_id=session_id)

#     # 4. Check State after run
#     status = await adk_session.get("workflow_status", session_id=session_id)
#     options = await adk_session.get("food_options", session_id=session_id)

#     # 5. Sync to DB (So UI can poll it)
#     db_manager.update_session_status(session_id, status, options)

#     return {
#         "session_id": session_id,
#         "status": status,
#         "options": options
#     }


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
