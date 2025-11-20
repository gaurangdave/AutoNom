"""
Rich logging utilities for the Auto-Nom API.
Provides attractive console output for various operations.
"""

from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from rich import box
from datetime import datetime
from typing import List, Dict, Any

# Initialize Rich Console
console = Console()

class AutoNomLogger:
    """Logger class with rich formatting for Auto-Nom API operations."""
    
    @staticmethod
    def startup_message():
        """Display server startup message."""
        console.print(Panel.fit(
            Text("🤖 Auto-Nom API Server", style="bold magenta"),
            box=box.DOUBLE,
            style="bright_blue"
        ))
        console.print("[green]✅ Database initialized successfully[/green]")
        console.print("[cyan]🚀 Server ready to accept requests[/cyan]")
        console.print("[yellow]📍 API Documentation: http://localhost:8000/docs[/yellow]")
    
    @staticmethod
    def shutdown_message():
        """Display server shutdown message."""
        console.print(Panel(
            Text("👋 Auto-Nom API Server Shutting Down", style="bold red"),
            box=box.DOUBLE,
            style="red"
        ))
        console.print("[yellow]🔄 Cleanup completed[/yellow]")
    
    @staticmethod
    def health_check():
        """Log health check access."""
        console.print("[dim]🔍 Health check endpoint accessed[/dim]")
    
    @staticmethod
    def fetching_users():
        """Log start of user fetching operation."""
        console.print("[blue]📋 Fetching all users from database...[/blue]")
    
    @staticmethod
    def users_retrieved_table(users: List[Dict[str, Any]]):
        """Display users in a formatted table."""
        table = Table(title="Users Retrieved", box=box.MINIMAL)
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="magenta")
        table.add_column("Preferences", style="green")
        table.add_column("Allergies", style="red")
        
        for user in users:
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
        console.print(f"[red]❌ Error retrieving users: {error}[/red]")
    
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
    def user_operation_success(name: str, user_id: str):
        """Log successful user operation."""
        console.print(f"[green]✅ User '{name}' (ID: {user_id}) created/updated successfully![/green]")
    
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
        console.print("[yellow]⚠️ Workflow logic not yet implemented - returning mock response[/yellow]")
    
    @staticmethod
    def workflow_trigger_success(user_id: str, meal_type: str):
        """Log successful workflow trigger."""
        console.print(f"[green]✅ Workflow triggered for user {user_id}, meal: {meal_type}[/green]")
    
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

# Database logging functions
class DatabaseLogger:
    """Logger class for database operations."""
    
    @staticmethod
    def database_initialized(db_path: str):
        """Log database initialization."""
        console.print(Panel(
            f"[green]Database initialized successfully[/green]\n"
            f"[cyan]Location:[/cyan] {db_path}\n"
            f"[cyan]Tables:[/cyan] users, orders",
            title="💾 Database Setup",
            border_style="green"
        ))
    
    @staticmethod
    def user_saved(name: str, user_id: str):
        """Log user save operation."""
        console.print(f"[green]💾 User '{name}' (ID: {user_id}) saved to database[/green]")
    
    @staticmethod
    def user_save_error(name: str, error: str):
        """Log user save error."""
        console.print(f"[red]❌ Database error saving user '{name}': {error}[/red]")
    
    @staticmethod
    def users_retrieved(count: int):
        """Log users retrieval."""
        console.print(f"[blue]📋 Retrieved {count} users from database[/blue]")
    
    @staticmethod
    def user_retrieval_error(error: str):
        """Log user retrieval error."""
        console.print(f"[red]❌ Database error retrieving users: {error}[/red]")