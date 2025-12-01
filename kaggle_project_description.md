This is a comprehensive project description tailored for your Capstone submission, GitHub `README.md`, or a portfolio write-up. It synthesizes the vision, architecture, and technical implementation we have built.

---

# Auto Nom: Your Agentic Concierge
### *Autonomous Meal Orchestration with Human-in-the-Loop Control*

## 1. The Vision
In the era of Generative AI, we still spend too much time staring at food delivery apps asking, *"What do I want to eat?"* Traditional chatbots help you search, but they don't **do**.

**Auto Nom** moves beyond the chatbot paradigm to the **Agentic Paradigm**. It is not a tool you talk *to*; it is a system that works *for* you. It proactively monitors your schedule, understands your deep context (allergies, dietary goals, mood, weather), and orchestrates the entire logistics of meal planning—from discovery to delivery.

Our vision is a world where technology removes cognitive load. Auto Nom handles the research, filtering, and configuration, requiring the user only to provide the final "nod" of approval.

## 2. Core Agentic Fundamentals
This project demonstrates advanced application of the **Google Agent Development Kit (ADK)**, moving beyond simple prompt chaining into a robust, state-driven multi-agent system.

### A. The Orchestrator-Worker Pattern (Multi-Agent System)
We implemented a Hub-and-Spoke architecture where a central "Brain" delegates tasks to specialized workers.
* **`AutoNom` (The Orchestrator):** A state-aware controller that manages the high-level workflow. It does not search or order; it directs traffic based on the current state.
* **`MealChoiceGenerator` (The Researcher):** A worker agent equipped with search tools (`get_restaurants_by_cuisine`, `get_menu_items`) to query our external microservice. It handles the "fuzzy logic" of matching user vibes (e.g., "warm comfort food") to database records.
* **`MealChoiceVerifier` (The Interface):** A worker responsible for formatting data for human consumption and initiating the Human-in-the-Loop pause.
* **`MealOrderExecutor` (The Action Taker):** A strict, logic-driven agent that handles money/transaction logic, calculating bill totals and executing the final API call.

### B. Deterministic State Control over Non-Deterministic LLMs
To prevent the agent from looping or hallucinating steps, we implemented a **Finite State Machine (FSM)** stored in a persistent SQLite database.
* The Orchestrator reads `workflow_status` (e.g., `MEAL_PLANNING_COMPLETE`, `AWAITING_USER_APPROVAL`).
* Transitions are hard-coded in the system prompt, ensuring the LLM acts as a reasoning engine within strict guardrails.

### C. Tool Use & Microservices
Instead of hardcoding data, the agents interact with **DashDoor**, a custom-built mock API microservice running in a separate Docker container.
* The agents use **Function Calling** to filter restaurants by tags, price, and cuisine.
* This decoupling mimics real-world enterprise architecture where the AI layer is separate from the data layer.

### D. Human-in-the-Loop (HITL) Architecture
We treat the user as a critical function call. The system is designed to **pause execution** when a major decision (spending money) is required.
* The agent suspends its session state to the database.
* The Web UI polls for this "Awaiting Approval" state.
* User interaction triggers a `resume_workflow` API call, waking the agent up to finish the job.

## 3. Current Application Features

### 🖥️ The "Agent-Native" UI
We moved away from a chat interface to a modern **React + Vite Dashboard**.
* **Live Thought Stream:** The user can expand a panel to see the agent's live reasoning events (Tool Calls, API responses, Thinking traces) via Server-Sent Events (SSE).
* **Structured Cards:** Options are presented as rich UI cards, not text blocks.
* **Dynamic Profile:** Users can configure complex schedules (e.g., "Vegan on Mondays, Cheat Day on Fridays").

### 🧠 Advanced Reasoning Capabilities
The system handles complex scenarios beyond simple keyword matching:
1.  **Semantic Search:** Translating "I need a warm hug in a bowl" -> Search for *Soup/Ramen* -> Filter by *4.8+ Stars*.
2.  **Constraint Solving:** Handling "Group Orders" where the agent must find a restaurant that satisfies conflicting constraints (e.g., "Half the group is Vegan, half is Gluten-Free").
3.  **Auto-Bundling:** The agent can autonomously build a multi-item cart (Appetizers + Mains) within a specific budget constraint.

### 🏗️ Infrastructure
* **Backend:** Python (Google ADK) + FastAPI (Async).
* **Frontend:** React + Tailwind CSS (served via FastAPI static mounts).
* **Database:** SQLite (with WAL mode for concurrency) managing Sessions, Users, and Order History.
* **Deployment:** Fully containerized with **Docker Compose**, orchestrating the Agent App and the Mock API Service side-by-side.
