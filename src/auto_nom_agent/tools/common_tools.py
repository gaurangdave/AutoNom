from google.adk.tools.tool_context import ToolContext

def update_workflow_status(status: str, tool_context: ToolContext) -> dict[str, str]:
    """Updates the workflow status value

    Args:
        status (str): String value for the new workflow status

    Returns:
        dict[str, str]: Returns dictionary with message and status of workflow status update. 
    """
    current_status = tool_context.state["workflow_status"]
    tool_context.state["workflow_status"] = status
    return {
        "status": "success",
        "message": f"workflow status updated from {current_status} to {status}"
    }
