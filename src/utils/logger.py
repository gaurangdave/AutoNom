"""
Rich logging utilities for the Auto-Nom API.
Provides attractive console output for various operations.
"""

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from src.schema.users import UserProfile

# Import from shared logger
from utils.logger import ServiceLogger

# Initialize Rich Console
console = Console()

class AutoNomLogger(ServiceLogger):
    """Logger class with rich formatting for Auto-Nom API operations."""
    
    # --- AUTO-NOM SPECIFIC LOGGING METHODS ---
    
    @staticmethod
    def startup_message():
        """Display server startup message."""
        ServiceLogger.startup_message("Auto-Nom API", port=8000)
        AutoNomLogger.log_success("Database initialized successfully")
    
    @staticmethod
    def shutdown_message():
        """Display server shutdown message."""
        ServiceLogger.shutdown_message("Auto-Nom API")
    
    @staticmethod
    def health_check():
        """Log health check access."""
        ServiceLogger.log_debug("Health check endpoint accessed", "🔍")
    
    @staticmethod
    def fetching_users():
        """Log start of user fetching operation."""
        AutoNomLogger.log_info("Fetching all users from database...", "API")
    
    @staticmethod
    def users_retrieved_table(users: Union[List[Dict[str, Any]], List[UserProfile]]):
        """Display users in a formatted table."""
        table = Table(title="Users Retrieved", box=box.MINIMAL)
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="magenta")
        table.add_column("Preferences", style="green")
        table.add_column("Allergies", style="red")
        
        for user in users:
            if isinstance(user, UserProfile):
                # Handle UserProfile objects
                preferences_str = ", ".join(user.preferences)
                allergies_str = ", ".join(user.allergies)
                table.add_row(
                    user.id,
                    user.name,
                    preferences_str or "None",
                    allergies_str or "None"
                )
            else:
                # Handle legacy dictionary format for backward compatibility
                preferences_str = ", ".join(user.get('preferences', []))
                allergies_str = ", ".join(user.get('allergies', []))
                table.add_row(
                    user.get('id', 'N/A'),
                    user.get('name', 'N/A'),
                    preferences_str or "None",
                    allergies_str or "None"
                )
        
        console.print(table)
        console.print(f"[green]✅ Successfully retrieved {len(users)} users[/green]")
    
    @staticmethod
    def user_retrieval_error(error: str):
        """Log user retrieval error."""
        AutoNomLogger.log_error("Error retrieving users", "API", error=Exception(error))
    
    @staticmethod
    def user_operation_panel(user_id: str, name: str, preferences: List[str], 
                           allergies: List[str], schedule: Dict[str, Any]):
        """Display user creation/update operation panel."""
        console.print(Panel(
            f"[bold yellow]Creating/Updating User[/bold yellow]\n"
            f"[cyan]ID:[/cyan] {user_id}\n"
            f"[cyan]Name:[/cyan] {name}\n"
            f"[cyan]Preferences:[/cyan] {', '.join(preferences) if preferences else 'None'}\n"
            f"[cyan]Allergies:[/cyan] {', '.join(allergies) if allergies else 'None'}\n"
            f"[cyan]Schedule Days:[/cyan] {', '.join(schedule.get('days', [])) if schedule else 'None'}\n"
            f"[cyan]Meal Slots:[/cyan] {len(schedule.get('meals', [])) if schedule else 0} meals",
            title="👤 User Operation",
            border_style="blue"
        ))
    
    @staticmethod
    def user_operation_panel_from_profile(user_profile: UserProfile):
        """Display user creation/update operation panel using UserProfile object."""
        console.print(Panel(
            f"[bold yellow]Creating/Updating User[/bold yellow]\n"
            f"[cyan]ID:[/cyan] {user_profile.id}\n"
            f"[cyan]Name:[/cyan] {user_profile.name}\n"
            f"[cyan]Preferences:[/cyan] {', '.join(user_profile.preferences) if user_profile.preferences else 'None'}\n"
            f"[cyan]Allergies:[/cyan] {', '.join(user_profile.allergies) if user_profile.allergies else 'None'}\n"
            f"[cyan]Schedule Days:[/cyan] {', '.join(user_profile.schedule.get('days', [])) if user_profile.schedule else 'None'}\n"
            f"[cyan]Meal Slots:[/cyan] {len(user_profile.schedule.get('meals', [])) if user_profile.schedule else 0} meals\n"
            f"[cyan]Special Instructions:[/cyan] {user_profile.special_instructions or 'None'}",
            title="👤 User Operation",
            border_style="blue"
        ))
    
    @staticmethod
    def user_operation_success(name: str, user_id: str):
        """Log successful user operation."""
        AutoNomLogger.log_success(
            f"User '{name}' (ID: {user_id}) created/updated successfully!",
            "USER"
        )
    
    @staticmethod
    def user_operation_error(user_id: str, error: str):
        """Display user operation error panel."""
        console.print(Panel(
            f"[red]Failed to create/update user[/red]\n"
            f"[yellow]User ID:[/yellow] {user_id}\n"
            f"[yellow]Error:[/yellow] {error}",
            title="❌ Error",
            border_style="red"
        ))
    
    @staticmethod
    def workflow_trigger_panel(user_id: str, meal_type: str):
        """Display workflow trigger panel."""
        console.print(Panel(
            f"[bold cyan]Triggering Meal Workflow[/bold cyan]\n"
            f"[yellow]User ID:[/yellow] {user_id}\n"
            f"[yellow]Meal Type:[/yellow] {meal_type}\n"
            f"[yellow]Timestamp:[/yellow] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            title="🍽️ Workflow Trigger",
            border_style="cyan"
        ))
    
    @staticmethod
    def workflow_mock_warning():
        """Display mock workflow warning."""
        AutoNomLogger.log_warning("Workflow logic not yet implemented - returning mock response", "WORKFLOW")
    
    @staticmethod
    def workflow_trigger_success(user_id: str, meal_type: str):
        """Log successful workflow trigger."""
        AutoNomLogger.log_success(
            f"Workflow triggered for user {user_id}, meal: {meal_type}",
            "WORKFLOW"
        )
    
    @staticmethod
    def workflow_trigger_error(user_id: str, meal_type: str, error: str):
        """Display workflow trigger error panel."""
        console.print(Panel(
            f"[red]Workflow trigger failed[/red]\n"
            f"[yellow]User ID:[/yellow] {user_id}\n"
            f"[yellow]Meal Type:[/yellow] {meal_type}\n"
            f"[yellow]Error:[/yellow] {error}",
            title="❌ Workflow Error",
            border_style="red"
        ))
    
    @staticmethod
    @staticmethod
    def api_called_panel(method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, 
                        user_id: Optional[str] = None, request_id: Optional[str] = None):
        """Display a generic API call panel for logging method and parameters."""
        # Build the content string
        content_lines = [f"[bold cyan]API Call: {method.upper()} {endpoint}[/bold cyan]"]
        
        # Add timestamp
        content_lines.append(f"[yellow]Timestamp:[/yellow] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Add user ID if provided
        if user_id:
            content_lines.append(f"[yellow]User ID:[/yellow] {user_id}")
        
        # Add request ID if provided
        if request_id:
            content_lines.append(f"[yellow]Request ID:[/yellow] {request_id}")
        
        # Add parameters if provided
        if params:
            content_lines.append("[yellow]Parameters:[/yellow]")
            for key, value in params.items():
                # Truncate long values for readability
                display_value = str(value)
                if len(display_value) > 100:
                    display_value = display_value[:97] + "..."
                content_lines.append(f"  [cyan]└─ {key}:[/cyan] {display_value}")
        
        content = "\n".join(content_lines)
        
        console.print(Panel(
            content,
            title="🌐 API Call",
            border_style="blue"
        ))

# Database logging functions
class DatabaseLogger:
    """Logger class for database operations using generic AutoNomLogger methods."""
    
    @staticmethod
    def database_initialized(db_path: str):
        """Log database initialization."""
        AutoNomLogger.log_panel(
            "💾 Database Setup",
            "[green]Database initialized successfully[/green]",
            "green",
            location=db_path,
            tables="users, orders"
        )
    
    @staticmethod
    def user_saved(name: str, user_id: str):
        """Log user save operation."""
        AutoNomLogger.log_success(
            f"User '{name}' (ID: {user_id}) saved to database",
            "DB"
        )
    
    @staticmethod
    def user_save_error(name: str, error: str):
        """Log user save error."""
        AutoNomLogger.log_error(
            f"Database error saving user '{name}'",
            "DB",
            error=Exception(error)
        )
    
    @staticmethod
    def users_retrieved(count: int):
        """Log users retrieval."""
        AutoNomLogger.log_info(
            f"Retrieved {count} users from database",
            "DB"
        )
    
    @staticmethod
    def user_retrieval_error(error: str):
        """Log user retrieval error."""
        AutoNomLogger.log_error(
            "Database error retrieving users",
            "DB",
            error=Exception(error)
        )


# Convenience functions for quick access to common logging patterns
class Logger:
    """Convenience wrapper for common logging operations."""
    
    # Direct access to AutoNomLogger methods
    debug = AutoNomLogger.log_debug
    info = AutoNomLogger.log_info
    success = AutoNomLogger.log_success
    warning = AutoNomLogger.log_warning
    error = AutoNomLogger.log_error
    panel = AutoNomLogger.log_panel
    table = AutoNomLogger.log_table
    api_request = AutoNomLogger.log_api_request
    api_response = AutoNomLogger.log_api_response
    
    @staticmethod
    def function_entry(func_name: str, **kwargs: Any):
        """Log function entry with parameters."""
        AutoNomLogger.log_debug(f"Entering function: {func_name}", "FUNC", **kwargs)
    
    @staticmethod
    def function_exit(func_name: str, result: Any = None, duration: float | None = None):
        """Log function exit with result and duration."""
        extras = {}
        if result is not None:
            extras["result"] = str(result)[:100]  # Truncate long results
        if duration is not None:
            extras["duration_ms"] = f"{duration:.2f}"
        
        AutoNomLogger.log_debug(f"Exiting function: {func_name}", "FUNC", **extras)
    
    @staticmethod
    def performance(operation: str, duration: float, **kwargs: Any):
        """Log performance metrics."""
        if duration > 1000:  # > 1 second
            AutoNomLogger.log_warning(f"Slow operation: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)
        elif duration > 500:  # > 500ms
            AutoNomLogger.log_info(f"Operation completed: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)
        else:
            AutoNomLogger.log_debug(f"Operation completed: {operation}", "PERF", duration_ms=f"{duration:.2f}", **kwargs)