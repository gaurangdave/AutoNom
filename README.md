# Auto-Nom 🤖🍲

**Auto-Nom** (short for auto nom nom nom nom) is a proof-of-concept (POC) personal assistant that uses agentic AI to proactively manage and order your meals.

This project is being built for the AI Intensive Capstone (December 2025) to demonstrate advanced concepts in multi-agent systems using the Google Agent Development Kit (ADK).

## What is Auto-Nom?

At its core, Auto-Nom is a "concierge agent" designed to answer the daily question: "What's for lunch?"

Instead of you reacting to hunger, **Auto-Nom** proactively works for you. An hour before your scheduled mealtime (e.g., breakfast, lunch, or dinner), the agent system wakes up and begins a workflow:

1.  **Analyze:** It checks your preferences (dietary restrictions, allergies, cuisine likes/dislikes) and its own memory (what you ate last time).
2.  **Research:** It consults external tools, like the weather (to see if it's a good day for soup) and Google's data (to find local restaurants).
3.  **Propose:** It selects the top 3 recommendations that fit your criteria.
4.  **Interact:** It messages you (via Telegram) with the options and waits for your choice.
5.  **Execute:** Once you've chosen (or if a 30-minute timeout elapses), it automatically places the order with a mock ordering service.

## The Vision: A "Real" Agentic System

This project is more than just a script; it's an exploration of a production-ready agentic system.

The primary goal is to apply and master key agentic concepts, including:

* **Multi-Agent Systems:** Using a team of specialized agents (e.g., `MealPlannerAgent`, `FoodScoutAgent`, `NotificationAgent`) that work together.
* **Long-Running Operations:** Implementing "pause/resume" logic as the agent waits for user input from Telegram.
* **Long-Term Memory:** Using the `MemoryBank` to ensure Auto-Nom gets smarter with every order and avoids repeating the same meal.
* **Tool Use:** Integrating a mix of built-in tools (like Google Search/MCP) and custom-built tools (like Telegram and a mock OpenAPI for ordering).

This repository aims to be a high-quality, end-to-end example of a modern AI application, fully containerized with Docker and ready for demonstration.

## 🚧 Project Status

**Phase 1: Tracer Bullet**
* The project is in its initial "tracer bullet" phase.
* The core logic is being mapped out in a hardcoded `src/main.py` script to validate the workflow before complex ADK implementation.