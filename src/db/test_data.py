"""
Test user profiles for AutoNom demo.
These profiles are designed to showcase different agent reasoning capabilities.
"""

from src.schema.users import UserProfile

# Test User 1: The "Health-Conscious Budget" User (The Optimizer)
FITNESS_FIONA = UserProfile(
    id="fitness_fiona",
    name="Fitness Fiona",
    preferences=["High-Protein", "Low-Calorie"],
    allergies=[],
    schedule={
        "days": ["m", "tu", "w", "th", "f"],
        "meals": [
            {
                "id": 1001,
                "type": "Lunch",
                "start": "12:00",
                "end": "13:00",
                "customName": ""
            },
            {
                "id": 1002,
                "type": "Dinner",
                "start": "18:00",
                "end": "19:00",
                "customName": ""
            }
        ]
    },
    special_instructions=(
        "I'm on a strict cut. Keep it under $15. No fast food. "
        "Meals must be under 600 calories."
    )
)

# Test User 2: The "Group Order" Nightmare (The Constraint Solver)
OFFICE_MANAGER_MIKE = UserProfile(
    id="office_manager_mike",
    name="Office Manager Mike",
    preferences=["Variety"],
    allergies=["Gluten", "Peanuts"],
    schedule={
        "days": ["m", "tu", "w", "th", "f"],
        "meals": [
            {
                "id": 2001,
                "type": "Lunch",
                "start": "12:00",
                "end": "13:00",
                "customName": "Team Lunch"
            }
        ]
    },
    special_instructions=(
        "Ordering for a team. We need a variety of options, but EVERYTHING must be "
        "safe for our celiac and nut-allergy team members. No cross-contamination risk."
    )
)

# Test User 3: The "Vague & Picky" User (The Discovery Agent)
LATE_NIGHT_LARRY = UserProfile(
    id="late_night_larry",
    name="Late Night Larry",
    preferences=["Greasy", "Comforting", "Spicy"],
    allergies=[],
    schedule={
        "days": ["m", "tu", "w", "th", "f", "sa", "su"],
        "meals": [
            {
                "id": 3001,
                "type": "Dinner",
                "start": "20:00",
                "end": "21:00",
                "customName": "Late Night Feast"
            }
        ]
    },
    special_instructions=(
        "I had a long day. I want something greasy and comforting. "
        "Something spicy but not Indian food. Maybe Asian? Surprise me."
    )
)

# All test users for easy iteration
TEST_USERS = [
    FITNESS_FIONA,
    OFFICE_MANAGER_MIKE,
    LATE_NIGHT_LARRY
]


def get_test_users():
    """
    Returns all test user profiles.
    """
    return TEST_USERS
