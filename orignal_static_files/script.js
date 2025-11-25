// --- GLOBAL STATE MANAGEMENT ---
const AppState = {
    users: [],
    currentUser: null,
    currentUserId: null,
    isLoading: false,
    activeSessionId: null, // Add active session ID to app state

    // Initialize state
    init() {
        this.users = [];
        this.currentUser = null;
        this.currentUserId = null;
        this.isLoading = false;
        this.activeSessionId = null;
    },

    // Set active session ID
    setActiveSessionId(sessionId) {
        this.activeSessionId = sessionId;
        currentActiveSessionId = sessionId;
        console.log('🔄 Active session ID updated:', sessionId);
    },

    // Clear active session ID
    clearActiveSessionId() {
        this.activeSessionId = null;
        currentActiveSessionId = null;
        console.log('🧹 Active session ID cleared');
    },

    // Set users list
    setUsers(users) {
        this.users = users;
    },

    // Get user by ID
    getUserById(userId) {
        if (!userId) return null;

        // Check API users first
        const apiUser = this.users.find(u => u.id === userId);
        if (apiUser) return apiUser;

        // Fallback to mock users
        return mockUsers[userId] || null;
    },

    // Set current user
    setCurrentUser(userId) {
        this.currentUserId = userId;
        this.currentUser = this.getUserById(userId);

        // Store in localStorage for persistence
        if (userId && userId !== 'create_new') {
            localStorage.setItem('autonom_current_user', userId);
        }
    },

    // Get current user ID (with fallback logic)
    getCurrentUserId() {
        const select = document.getElementById('user-select');
        if (!select) return this.currentUserId;

        if (select.value === 'create_new') {
            return select.dataset.newUserId || `user_${Date.now()}`;
        }
        return select.value || this.currentUserId;
    },

    // Update current user data
    updateCurrentUser(userData) {
        if (this.currentUser) {
            Object.assign(this.currentUser, userData);
        }
    },

    // Add or update user in the users list
    upsertUser(userData) {
        const existingIndex = this.users.findIndex(u => u.id === userData.id);
        if (existingIndex !== -1) {
            this.users[existingIndex] = userData;
        } else {
            this.users.push(userData);
        }

        // If this is the current user, update current user data
        if (this.currentUserId === userData.id) {
            this.currentUser = userData;
        }
    },

    // Get user preferences safely
    getUserPreferences(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user?.preferences || [];
    },

    // Get user allergies safely
    getUserAllergies(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user?.allergies || [];
    },

    // Get user schedule safely
    getUserSchedule(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user?.schedule || { days: [], meals: [], instructions: '' };
    },

    // Get user instructions safely
    getUserInstructions(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user?.schedule?.instructions || user?.instructions || '';
    },

    // Get user meals safely
    getUserMeals(userId = null) {
        const user = userId ? this.getUserById(userId) : this.currentUser;
        return user?.schedule?.meals || user?.meals || [];
    }
};

// --- UTILITY FUNCTIONS FOR STATE MANAGEMENT ---

// Easy access to current user data
const UserData = {
    get current() {
        return AppState.currentUser;
    },

    get id() {
        return AppState.getCurrentUserId();
    },

    get name() {
        return AppState.currentUser?.name || '';
    },

    get preferences() {
        return AppState.getUserPreferences();
    },

    get allergies() {
        return AppState.getUserAllergies();
    },

    get schedule() {
        return AppState.getUserSchedule();
    },

    get meals() {
        return AppState.getUserMeals();
    },

    get instructions() {
        return AppState.getUserInstructions();
    }
};

// UI Update helpers
const UIHelpers = {
    // Update user selector dropdown
    updateUserSelector(userId) {
        const select = document.getElementById('user-select');
        if (select && userId && userId !== 'create_new') {
            select.value = userId;
        }
    },

    // Clear all form fields
    clearForm() {
        document.getElementById('input-name').value = '';
        document.getElementById('input-instructions').value = '';

        // Clear tags
        const tagContainer = document.getElementById('pref-tags');
        tagContainer.innerHTML = '';

        // Clear allergies
        const allergyCards = document.querySelectorAll('.allergy-card');
        allergyCards.forEach(card => {
            card.classList.remove('ring-2', 'ring-primary-500', 'bg-slate-800', 'text-primary-400');
        });

        // Clear days
        const dayButtons = document.querySelectorAll('.day-selector');
        dayButtons.forEach(btn => {
            btn.className = `w-full aspect-square rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm hover:border-primary-500 hover:text-white transition-all flex items-center justify-center day-selector`;
        });

        // Clear meal slots
        const slotsContainer = document.getElementById('meal-slots-container');
        const savedMealsContainer = document.getElementById('saved-meals-container');
        slotsContainer.innerHTML = '';
        savedMealsContainer.innerHTML = '';
    },

    // Show/hide loading state
    setLoadingState(isLoading) {
        AppState.isLoading = isLoading;
        if (isLoading) {
            document.body.classList.add('opacity-50');
        } else {
            document.body.classList.remove('opacity-50');
        }
    }
};

// --- 1. MOCK DATA ---
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const allergiesList = [
    { name: 'Peanuts', icon: 'fa-bowl-rice' },
    { name: 'Dairy', icon: 'fa-cheese' },
    { name: 'Gluten', icon: 'fa-bread-slice' },
    { name: 'Shellfish', icon: 'fa-shrimp' },
    { name: 'Soy', icon: 'fa-seedling' },
    { name: 'Eggs', icon: 'fa-egg' },
    { name: 'Fish', icon: 'fa-fish' },
    { name: 'Tree Nuts', icon: 'fa-tree' },
];

// Mock Users for Dropdown
const mockUsers = {
    "user_1": {
        name: "Tony",
        preferences: ["High Protein", "Spicy", "Japanese"],
        allergies: ["Shellfish"],
        instructions: "Always order extra napkins. Gate code 9000.",
        meals: [
            { id: 1, type: "Lunch", start: "12:00", end: "13:00" },
            { id: 2, type: "Dinner", start: "19:00", end: "20:00" }
        ]
    },
    "user_2": {
        name: "Bruce",
        preferences: ["Paleo", "No Sugar", "Steak"],
        allergies: [],
        instructions: "Deliver to the back cave entrance.",
        meals: [
            { id: 3, type: "Post-Patrol Meal", start: "04:00", end: "05:00" }
        ]
    },
    "user_3": {
        name: "Peter",
        preferences: ["Cheap", "Pizza", "Thai"],
        allergies: ["Peanuts"],
        instructions: "Don't ring the doorbell, Aunt May is sleeping.",
        meals: [
            { id: 4, type: "Dinner", start: "18:00", end: "19:00" }
        ]
    }
};

// --- 2. INIT UI ---
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize global state
    AppState.init();

    renderDays();
    renderAllergies();
    // renderMockHistory();

    // Load users from API and populate dropdown
    await populateUserDropdown();

    // Load previously selected user or first available user
    const savedUserId = localStorage.getItem('autonom_current_user');
    const select = document.getElementById('user-select');

    if (savedUserId && select.querySelector(`option[value="${savedUserId}"]`)) {
        select.value = savedUserId;
        await loadUser(savedUserId);
    } else if (select.options.length > 0) {
        await loadUser(select.options[0].value);
    }
});

// Cleanup polling when page is unloaded
window.addEventListener('beforeunload', () => {
    stopAllPolling();
});

async function populateUserDropdown() {
    try {
        const users = await fetchUsers();
        AppState.setUsers(users);
        const select = document.getElementById('user-select');

        // Clear existing options
        select.innerHTML = '';

        // Add "Create New" option first
        const createNewOption = document.createElement('option');
        createNewOption.value = 'create_new';
        createNewOption.textContent = '+ Create New User';
        createNewOption.style.fontStyle = 'italic';
        createNewOption.style.color = '#3b82f6';
        select.appendChild(createNewOption);

        // Add separator if there are users
        if (users.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────────';
            select.appendChild(separator);
        }

        // Add users from API
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            select.appendChild(option);
        });

        // If no users from API, fall back to mock users
        if (users.length === 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '──────────────';
            select.appendChild(separator);

            Object.keys(mockUsers).forEach(userId => {
                const user = mockUsers[userId];
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = user.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Fall back to mock users on error
        const select = document.getElementById('user-select');
        select.innerHTML = '';

        // Add "Create New" option first
        const createNewOption = document.createElement('option');
        createNewOption.value = 'create_new';
        createNewOption.textContent = '+ Create New User';
        createNewOption.style.fontStyle = 'italic';
        createNewOption.style.color = '#3b82f6';
        select.appendChild(createNewOption);

        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──────────────';
        select.appendChild(separator);

        Object.keys(mockUsers).forEach(userId => {
            const user = mockUsers[userId];
            const option = document.createElement('option');
            option.value = userId;
            option.textContent = user.name;
            select.appendChild(option);
        });
    }
}

// --- ACTIVE SESSIONS API FUNCTIONS ---

async function fetchActiveSessionsForUser(userId) {
    try {
        console.log('🌐 Fetching active session IDs from API for user:', userId);
        const response = await fetch(`/api/users/${userId}/active-sessions`);
        console.log('📡 API response status:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`User ${userId} not found`);
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Active sessions API response data:', data);

        // Store the last check data for comparison
        lastActiveSessionsCheck = data;

        return data;
    } catch (error) {
        console.error('❌ Error fetching active sessions:', error);
        return null;
    }
}

async function fetchSessionState(userId, sessionId) {
    try {
        console.log('🌐 Fetching session state from API for:', { userId, sessionId });
        const response = await fetch(`/api/users/${userId}/active-sessions/${sessionId}/state`);
        console.log('📡 Session state API response status:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Session ${sessionId} not found or no longer active`);
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 Session state API response data:', data);

        return data;
    } catch (error) {
        console.error('❌ Error fetching session state:', error);
        return null;
    }
}

async function checkAndDisplayActiveSessions(userId, isPollingCheck = false) {
    console.log('🔍 Checking active sessions for user:', userId, isPollingCheck ? '(polling)' : '(manual)');
    const activeSessionsResponse = await fetchActiveSessionsForUser(userId);
    console.log('📊 Active sessions response:', activeSessionsResponse);

    if (!activeSessionsResponse || activeSessionsResponse.active_sessions_count === 0) {
        console.log('❌ No active sessions found, hiding active sessions display');
        // No active sessions, clear state and hide display
        AppState.clearActiveSessionId();
        stopSessionStatePolling();
        hideActiveSessionsDisplay();
        return;
    }

    console.log('✅ Active sessions found:', activeSessionsResponse.active_sessions_count);
    console.log('📋 Session IDs:', activeSessionsResponse.session_ids);

    // Get the first active session ID
    const sessionId = activeSessionsResponse.session_ids[0];
    console.log('🎯 Using session ID:', sessionId);

    // If this is a new active session, update app state and start session state polling
    if (sessionId !== AppState.activeSessionId) {
        console.log('🆕 New active session detected, switching to session state polling');
        AppState.setActiveSessionId(sessionId);
        currentSessionId = sessionId; // Also set for response handling

        // Stop active sessions polling since we found an active session
        stopActiveSessionsPolling();
        console.log('⏹️ Stopped active sessions polling, found active session');

        // Start polling the session state
        console.log('🚀 About to start session state polling...');
        startSessionStatePolling(userId, sessionId);
    } else {
        console.log('🔄 Same active session, session state polling should already be running');
        // Make sure we're not still doing active sessions polling for the same session
        if (isPollingActive) {
            stopActiveSessionsPolling();
            console.log('⏹️ Stopped duplicate active sessions polling');
        }
    }

    // Show active sessions in the status tab (simplified display)
    displayActiveSessionFound(activeSessionsResponse);
}

function startSessionStatePolling(userId, sessionId) {
    console.log('▶️ Starting session state polling for:', { userId, sessionId });

    // Stop any existing session state polling
    stopSessionStatePolling();

    // Start new session state polling interval
    isSessionStatePollingActive = true;
    sessionStatePollingInterval = setInterval(async () => {
        if (isSessionStatePollingActive && userId && sessionId) {
            console.log('🔄 Session state polling tick for:', { userId, sessionId });
            await checkSessionState(userId, sessionId);
        } else {
            console.log('⚠️ Session state polling tick skipped - inactive or missing params');
        }
    }, 5000); // Poll every 5 seconds

    console.log('✅ Session state polling started (5s interval)');
}

function stopSessionStatePolling() {
    console.log('⏹️ Stopping session state polling');

    if (sessionStatePollingInterval) {
        clearInterval(sessionStatePollingInterval);
        sessionStatePollingInterval = null;
    }

    isSessionStatePollingActive = false;
    console.log('✅ Session state polling stopped');
}

async function checkSessionState(userId, sessionId) {
    console.log('🔍 Checking session state for:', { userId, sessionId });
    const sessionStateResponse = await fetchSessionState(userId, sessionId);

    if (!sessionStateResponse) {
        console.log('❌ Session state not found, session may have ended');
        // Session ended, clean up
        AppState.clearActiveSessionId();
        stopSessionStatePolling();
        // Restart active sessions polling
        startActiveSessionsPolling(userId);
        return;
    }

    const workflowStatus = sessionStateResponse.state.workflow_status;
    console.log('📊 Current workflow status:', workflowStatus);

    switch (workflowStatus) {
        case 'AWAITING_USER_APPROVAL':
            const verificationMessage = sessionStateResponse.state.meal_choice_verification_message;
            if (verificationMessage) {
                console.log('🔔 Session awaiting user approval, showing chat modal');

                // Stop session state polling temporarily to avoid modal spam
                stopSessionStatePolling();

                // Show the chat modal with the verification message
                showChatModal(verificationMessage, {
                    type: 'TextResponse',
                    isFinalResponse: true,
                    text: verificationMessage,
                    workflow_status: 'AWAITING_USER_APPROVAL',
                    session_id: sessionId
                });
            }
            break;

        case 'ORDER_CONFIRMED':
            console.log('🎉 Order confirmed from session state! Showing celebration and cleaning up');

            // Show celebratory message
            const confirmationMessage = sessionStateResponse.state.order_confirmation_message || 'Your order has been confirmed and is being prepared!';
            console.log('🎊 Confirmation message:', confirmationMessage);
            showCelebratoryMessage(confirmationMessage);

            // Clean up - stop polling and clear active session
            stopSessionStatePolling();
            AppState.clearActiveSessionId();

            // Restart active sessions polling to check for new sessions
            setTimeout(() => {
                console.log('🔄 Restarting active sessions polling after order confirmation');
                startActiveSessionsPolling(userId);
            }, 3000); // Wait a bit longer before restarting polling
            break;

        default:
            console.log('ℹ️ Session in progress with status:', workflowStatus);
            // Continue polling for other statuses
            break;
    }
}

// --- ACTIVE SESSIONS POLLING FUNCTIONS ---

function startActiveSessionsPolling(userId) {
    console.log('▶️ Starting active sessions polling for user:', userId);

    // Stop any existing polling
    stopActiveSessionsPolling();

    // Start new polling interval
    isPollingActive = true;
    activeSessionsPollingInterval = setInterval(async () => {
        if (isPollingActive && userId) {
            await checkAndDisplayActiveSessions(userId, true);
        }
    }, 5000); // Poll every 5 seconds

    console.log('✅ Active sessions polling started (5s interval)');
}

function stopActiveSessionsPolling() {
    console.log('⏹️ Stopping active sessions polling');

    if (activeSessionsPollingInterval) {
        clearInterval(activeSessionsPollingInterval);
        activeSessionsPollingInterval = null;
    }

    isPollingActive = false;
    console.log('✅ Active sessions polling stopped');
}

function stopAllPolling() {
    console.log('🛑 Stopping all polling');
    stopActiveSessionsPolling();
    stopSessionStatePolling();
}

function restartActiveSessionsPolling() {
    const currentUserId = getCurrentUserId();
    if (currentUserId && currentUserId !== 'create_new') {
        console.log('🔄 Restarting active sessions polling for user:', currentUserId);
        startActiveSessionsPolling(currentUserId);
    }
}

// --- 3. API FUNCTIONS ---

async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

async function saveUserToAPI(userData) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

// --- 4. CORE LOGIC ---

// Toggle Event Stream Visibility
function toggleEventStream() {
    const container = document.getElementById('event-stream-container');
    const icon = document.getElementById('expand-icon');
    const progress = document.getElementById('simple-progress');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        icon.classList.add('rotate-180');
        progress.style.opacity = '0';
    } else {
        container.classList.add('hidden');
        icon.classList.remove('rotate-180');
        progress.style.opacity = '1';
    }
}

function createNewUser() {
    // Generate a unique ID for new user
    const timestamp = Date.now();
    const newUserId = `user_${timestamp}`;

    // Clear all form fields using utility
    UIHelpers.clearForm();

    // Update the user select dropdown to show the new user ID
    const select = document.getElementById('user-select');
    select.value = 'create_new';

    // Store the new user ID for saving
    select.dataset.newUserId = newUserId;

    // Reset current user state
    AppState.setCurrentUser(null);
    AppState.currentUserId = newUserId;

    // Stop all polling when creating new user
    stopAllPolling();
    AppState.clearActiveSessionId();

    // Switch to profile tab
    switchTab('profile');

    // Focus on name input
    document.getElementById('input-name').focus();

    console.log('Ready to create new user with ID:', newUserId);
}

async function loadUser(userId) {
    // Handle create new user option
    if (userId === 'create_new') {
        createNewUser();
        return;
    }

    // Set current user in state
    AppState.setCurrentUser(userId);
    const user = AppState.currentUser;
    if (!user) return;

    // 1. Update Profile Inputs
    document.getElementById('input-name').value = user.name || '';
    // Handle instructions using AppState helper
    const instructions = AppState.getUserInstructions(userId);
    document.getElementById('input-instructions').value = instructions;

    // 2. Update Tags
    const tagContainer = document.getElementById('pref-tags');
    tagContainer.innerHTML = '';
    const preferences = AppState.getUserPreferences(userId);
    preferences.forEach(pref => addPreferenceTag(pref));

    // 3. Update allergies selection
    const allergyCards = document.querySelectorAll('.allergy-card');
    const userAllergies = AppState.getUserAllergies(userId);
    allergyCards.forEach(card => {
        const allergyName = card.querySelector('span').textContent;
        if (userAllergies.includes(allergyName)) {
            card.classList.add('ring-2', 'ring-primary-500', 'bg-slate-800', 'text-primary-400');
        } else {
            card.classList.remove('ring-2', 'ring-primary-500', 'bg-slate-800', 'text-primary-400');
        }
    });

    // 4. Update Schedule using AppState helpers
    const schedule = AppState.getUserSchedule(userId);
    const meals = AppState.getUserMeals(userId);
    // Update day selections and meal slots
    const dayButtons = document.querySelectorAll('.day-selector');
    const slotsContainer = document.getElementById('meal-slots-container');
    const savedMealsContainer = document.getElementById('saved-meals-container');

    slotsContainer.innerHTML = '';
    savedMealsContainer.innerHTML = '';

    // Update day selections
    dayButtons.forEach((btn, index) => {
        const dayKey = days[index].toLowerCase();
        if (schedule.days && schedule.days.includes(dayKey)) {
            btn.className = `w-full aspect-square rounded-full border-none bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 flex items-center justify-center day-selector`;
        } else {
            btn.className = `w-full aspect-square rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm hover:border-primary-500 hover:text-white transition-all flex items-center justify-center day-selector`;
        }
    });

    // Update meal slots
    if (meals && meals.length > 0) {
        meals.forEach(meal => {
            // Add to Profile - check if it's a custom meal type
            const isCustomMealType = !['Breakfast', 'Lunch', 'Dinner'].includes(meal.type);
            if (isCustomMealType) {
                addMealSlot('Custom', meal.start, meal.end, meal.type);
            } else {
                addMealSlot(meal.type, meal.start, meal.end);
            }

            // Add to Meals Tab
            renderSavedMealCard(meal);
        });
    }

    // Simulate "Fetching" effect
    document.body.classList.add('opacity-50');
    setTimeout(() => document.body.classList.remove('opacity-50'), 200);

    // Check for active sessions after loading user data
    await checkAndDisplayActiveSessions(userId);

    // Start polling for active sessions
    startActiveSessionsPolling(userId);
}

function renderSavedMealCard(meal) {
    const container = document.getElementById('saved-meals-container');
    const card = document.createElement('div');
    card.className = "bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 flex items-center justify-between group transition-all hover:shadow-lg hover:shadow-black/20";
    card.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary-400 group-hover:bg-slate-700/80 transition-colors">
                <i class="fa-solid ${meal.type.includes('Dinner') ? 'fa-moon' : 'fa-sun'} text-xl"></i>
            </div>
            <div>
                <h3 class="font-bold text-slate-200">${meal.type}</h3>
                <div class="text-xs text-slate-500 font-mono mt-1">
                    <i class="fa-regular fa-clock mr-1"></i> ${meal.start} - ${meal.end}
                </div>
            </div>
        </div>
        <button onclick="triggerPlan('${meal.type}')" class="bg-slate-700 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <span>Plan Now</span>
            <i class="fa-solid fa-arrow-right"></i>
        </button>
    `;
    container.appendChild(card);
}

// Helper function to get current user ID
function getCurrentUserId() {
    return AppState.getCurrentUserId();
}

// Global variable to store current session ID for user response
let currentSessionId = null;

// Global polling variables
let activeSessionsPollingInterval = null;
let sessionStatePollingInterval = null;
let lastActiveSessionsCheck = null;
let isPollingActive = false;
let isSessionStatePollingActive = false;
let currentActiveSessionId = null; // Store the active session ID

// Chat Modal Functions
function showChatModal(text, eventData) {
    console.log('📞 showChatModal called with text:', text.substring(0, 200) + '...');
    console.log('📞 showChatModal eventData:', eventData);

    const modal = document.getElementById('chat-modal');
    const messageContent = document.getElementById('chat-message-content');
    const responseInput = document.getElementById('chat-response-input');

    // Parse markdown and render
    if (typeof marked !== 'undefined') {
        try {
            // Configure marked for better list support
            marked.setOptions({
                breaks: true,
                gfm: true
            });

            const parsedMarkdown = marked.parse(text);
            console.log('🔄 Parsed markdown HTML:', parsedMarkdown);
            messageContent.innerHTML = parsedMarkdown;

            // Debug: Check if lists are in the parsed content
            if (parsedMarkdown.includes('<ol>') || parsedMarkdown.includes('<ul>')) {
                console.log('✅ Lists detected in parsed markdown');
            } else {
                console.log('❌ No lists found in parsed markdown');
                console.log('Original text:', text);
            }
        } catch (error) {
            console.error('❌ Markdown parsing error:', error);
            // Fallback to simple text with line breaks
            messageContent.innerHTML = text.replace(/\n/g, '<br>');
        }
    } else {
        console.log('⚠️ Marked library not available, using fallback');
        // Fallback to simple text with line breaks
        messageContent.innerHTML = text.replace(/\n/g, '<br>');
    }

    // Clear previous input
    responseInput.value = '';

    // Store session data for later use
    window.currentApprovalEvent = eventData;

    // Show modal
    modal.classList.remove('hidden');
    console.log('✅ Chat modal should now be visible');

    // Additional fallback: if marked.js failed to parse lists, try manual processing
    if (!messageContent.innerHTML.includes('<ol>') && !messageContent.innerHTML.includes('<li>') && text.includes('1.')) {
        console.log('🔧 Applying manual list processing as fallback');
        let processedText = messageContent.innerHTML;

        // Simple regex to convert numbered lists - handle both \n and <br> formats
        processedText = processedText.replace(
            /(\d+\.\s+\*\*([^*]+)\*\*\s+([^<\n]+))/g,
            '<div style="margin: 0.75rem 0; display: flex; align-items: flex-start;"><span style="font-weight: bold; margin-right: 0.5rem; color: rgb(59 130 246); min-width: 1.5rem;">$1</span></div>'
        );

        // Better approach - convert the whole thing to proper HTML list
        const lines = text.split('\n');
        let htmlContent = '';
        let inList = false;

        for (let line of lines) {
            line = line.trim();
            if (line.match(/^\d+\.\s+/)) {
                if (!inList) {
                    htmlContent += '<ol style="margin: 0.75rem 0; padding-left: 1.5rem; list-style-type: decimal;">';
                    inList = true;
                }

                const listContent = line.replace(/^\d+\.\s+/, '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                htmlContent += `<li style="margin: 0.25rem 0; line-height: 1.5; color: rgb(226 232 240);">${listContent}</li>`;
            } else if (line === '') {
                if (inList) {
                    htmlContent += '</ol>';
                    inList = false;
                }
                htmlContent += '<br>';
            } else {
                if (inList) {
                    htmlContent += '</ol>';
                    inList = false;
                }
                htmlContent += `<p style="margin: 0.75rem 0; line-height: 1.6; color: rgb(226 232 240);">${line}</p>`;
            }
        }

        if (inList) {
            htmlContent += '</ol>';
        }

        messageContent.innerHTML = htmlContent;
        console.log('🔧 Manual list processing applied:', htmlContent.substring(0, 200) + '...');
    }

    // Focus on input
    setTimeout(() => responseInput.focus(), 100);

    // Remove existing Enter key listener to avoid duplicates
    responseInput.removeEventListener('keydown', window.chatModalKeyHandler);

    // Add Enter key support for textarea
    window.chatModalKeyHandler = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitChatResponse();
        }
    };
    responseInput.addEventListener('keydown', window.chatModalKeyHandler);
}

function closeChatModal() {
    const modal = document.getElementById('chat-modal');
    const responseInput = document.getElementById('chat-response-input');

    modal.classList.add('hidden');
    window.currentApprovalEvent = null;

    // Clean up event listener
    if (window.chatModalKeyHandler) {
        responseInput.removeEventListener('keydown', window.chatModalKeyHandler);
        window.chatModalKeyHandler = null;
    }

    // Restart session state polling when modal is closed (if we have an active session)
    setTimeout(() => {
        const currentUserId = getCurrentUserId();
        if (currentActiveSessionId && currentUserId && currentUserId !== 'create_new') {
            console.log('🔄 Restarting session state polling after modal close');
            startSessionStatePolling(currentUserId, currentActiveSessionId);
        }
    }, 1000); // Small delay to avoid immediate re-trigger
}

function showCelebratoryMessage(text) {
    console.log('🎉 Showing celebratory message:', text);

    // Create a temporary celebration overlay
    const celebrationOverlay = document.createElement('div');
    celebrationOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    celebrationOverlay.style.animation = 'fadeIn 0.3s ease-in-out';

    celebrationOverlay.innerHTML = `
        <div class="bg-gradient-to-br from-green-600 to-green-700 border border-green-500 rounded-2xl max-w-lg mx-4 p-8 text-center shadow-2xl transform celebration-bounce">
            <div class="mb-4">
                <i class="fa-solid fa-check-circle text-white text-6xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">Order Confirmed! 🎉</h3>
            <div class="bg-white/10 rounded-lg p-4 border border-white/20">
                <p class="text-white text-lg leading-relaxed">${text}</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" class="mt-6 bg-white text-green-700 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors">
                <i class="fa-solid fa-thumbs-up mr-2"></i>Awesome!
            </button>
        </div>
    `;

    // Add custom bounce animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes celebrationBounce {
            0%, 20%, 53%, 80%, 100% {
                animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
                transform: translate3d(0, 0, 0) scale(1);
            }
            40%, 43% {
                animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
                transform: translate3d(0, -30px, 0) scale(1.1);
            }
            70% {
                animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
                transform: translate3d(0, -15px, 0) scale(1.05);
            }
            90% {
                transform: translate3d(0, -4px, 0) scale(1.02);
            }
        }
        .celebration-bounce {
            animation: celebrationBounce 1.2s ease-in-out;
        }
    `;

    // Add style to head temporarily
    document.head.appendChild(style);

    // Add to body
    document.body.appendChild(celebrationOverlay);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (celebrationOverlay.parentNode) {
            celebrationOverlay.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => {
                if (celebrationOverlay.parentNode) {
                    celebrationOverlay.remove();
                    // Clean up the style element
                    if (style.parentNode) {
                        style.remove();
                    }
                }
            }, 300);
        }
    }, 10000);

    // Update the status panel to reflect success
    document.getElementById('status-title').innerText = 'Order Confirmed';
    document.getElementById('status-subtitle').innerText = 'Your meal has been successfully ordered!';
}

async function submitChatResponse() {
    const responseInput = document.getElementById('chat-response-input');
    const submitBtn = document.getElementById('chat-submit-btn');
    const userResponse = responseInput.value.trim();

    if (!userResponse) {
        responseInput.focus();
        return;
    }

    if (!currentSessionId) {
        console.error('No session ID available for response');
        alert('Error: No active session found');
        return;
    }

    // Show loading state
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
        // Handle test scenario - if this is a test session, just close the modal
        if (currentSessionId === 'test-session-123') {
            console.log('Test response received:', userResponse);
            closeChatModal();

            // Simulate a response event after a brief delay
            setTimeout(() => {
                const timestamp = new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const testResponseEvent = {
                    "type": "TextResponse",
                    "isFinalResponse": true,
                    "text": `Thank you for choosing: "${userResponse}". Your order has been processed successfully!`,
                    "workflow_status": "ORDER_COMPLETE",
                    "session_id": "test-session-123"
                };

                renderEventInStream(testResponseEvent, timestamp);
            }, 1000);

            return;
        }

        // Send user response to resume workflow
        const response = await fetch(`/api/sessions/${currentSessionId}/resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                choice: userResponse
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Close modal first
        closeChatModal();

        // Handle the resumed event stream
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            console.log('📡 Resuming event stream with user response...');

            // Show streaming state in submit button
            submitBtn.innerHTML = `<i class="fa-solid fa-satellite-dish fa-pulse"></i> Streaming`;

            // Update Status UI to show resumption
            document.getElementById('status-title').innerText = 'Session Resumed';
            document.getElementById('status-subtitle').innerText = `Processing your response: "${userResponse.substring(0, 50)}${userResponse.length > 50 ? '...' : ''}"`;

            // Switch to Status tab to show progress
            switchTab('status');

            // Expand event stream to show events if it's collapsed
            const container = document.getElementById('event-stream-container');
            const icon = document.getElementById('expand-icon');
            const progress = document.getElementById('simple-progress');

            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                icon.classList.add('rotate-180');
                progress.style.opacity = '0';
            }

            // Handle the event stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('🏁 Resumed event stream completed');
                        break;
                    }

                    // Decode the chunk and add to buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Process complete messages from buffer
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, newlineIndex).trim();
                        buffer = buffer.slice(newlineIndex + 1);

                        if (line.length === 0) continue; // Skip empty lines

                        // Handle Server-Sent Events format
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6); // Remove 'data: ' prefix

                            if (data === '[DONE]') {
                                console.log('🔚 Resumed stream completed with [DONE] marker');
                                break;
                            }

                            try {
                                const jsonData = JSON.parse(data);
                                console.log('📦 Resumed event stream data:', jsonData);

                                // Render event in UI
                                const timestamp = new Date().toLocaleTimeString('en-US', {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                });
                                renderEventInStream(jsonData, timestamp);

                                // Log event details
                                if (jsonData.type) {
                                    console.log(`📋 Resumed event type: ${jsonData.type}`);
                                }
                                if (jsonData.message) {
                                    console.log(`💬 Resumed message: ${jsonData.message}`);
                                }
                                if (jsonData.status) {
                                    console.log(`📊 Resumed status: ${jsonData.status}`);
                                }

                            } catch (parseError) {
                                console.log('📄 Raw resumed stream data:', data);
                            }
                        } else if (line.startsWith('event: ')) {
                            const eventType = line.slice(7); // Remove 'event: ' prefix
                            console.log('🎯 Resumed event type:', eventType);
                        } else if (line.startsWith('id: ')) {
                            const eventId = line.slice(4); // Remove 'id: ' prefix
                            console.log('🆔 Resumed event ID:', eventId);
                        } else {
                            // Handle other line formats
                            console.log('📝 Resumed stream line:', line);
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            // Show completion state
            submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Completed`;
            console.log('✅ Resumed workflow stream completed successfully');

        } else {
            // Fallback to regular JSON response
            const result = await response.json();
            console.log('Workflow resumed successfully:', result);

            // Show success state briefly
            submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Sent`;

            // Update Status UI
            document.getElementById('status-title').innerText = 'Session Resumed';
            document.getElementById('status-subtitle').innerText = 'Response processed successfully';

            // Switch to Status tab
            switchTab('status');
        }

    } catch (error) {
        console.error('Error submitting chat response:', error);
        alert('Failed to send response. Please try again.');
    } finally {
        // Reset button after a delay to show completion
        setTimeout(() => {
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
        }, 2000);
    }
}

async function triggerPlan(mealType) {
    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    const currentUserId = getCurrentUserId();

    // Show loading state
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    btn.disabled = true;

    try {
        // Make API call to trigger workflow with streaming
        const response = await fetch(`/api/users/${currentUserId}/meals/${mealType}/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is a stream
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            console.log('📡 Starting event stream for', mealType, 'planning...');

            // Show streaming state
            btn.innerHTML = `<i class="fa-solid fa-satellite-dish fa-pulse"></i> Streaming`;

            // Update Status UI immediately
            document.getElementById('status-title').innerText = `${mealType} Planning`;
            document.getElementById('status-subtitle').innerText = `Streaming responses... Started just now`;

            // Clear and prepare event stream
            clearEventStream();

            // Switch to Status tab to show progress
            switchTab('status');

            // Expand event stream to show events
            const container = document.getElementById('event-stream-container');
            const icon = document.getElementById('expand-icon');
            const progress = document.getElementById('simple-progress');

            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                icon.classList.add('rotate-180');
                progress.style.opacity = '0';
            }

            // Handle the event stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            window.temp_buffer = [];
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        console.log('🏁 Event stream completed');
                        break;
                    }

                    // Decode the chunk and add to buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Process complete messages from buffer
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, newlineIndex).trim();
                        buffer = buffer.slice(newlineIndex + 1);

                        if (line.length === 0) continue; // Skip empty lines

                        // Handle Server-Sent Events format
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6); // Remove 'data: ' prefix

                            if (data === '[DONE]') {
                                console.log('🔚 Stream completed with [DONE] marker');
                                break;
                            }

                            try {
                                const jsonData = JSON.parse(data);
                                console.log('📦 Event stream data:', jsonData);
                                window.temp_buffer.push(jsonData);

                                // Store session ID if present in the event data
                                if (jsonData.session_id) {
                                    currentSessionId = jsonData.session_id;
                                    console.log('💾 Stored session ID:', currentSessionId);
                                }

                                // Render event in UI
                                const timestamp = new Date().toLocaleTimeString('en-US', {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                });
                                renderEventInStream(jsonData, timestamp);

                                // Log event details
                                if (jsonData.type) {
                                    console.log(`📋 Event type: ${jsonData.type}`);
                                }
                                if (jsonData.message) {
                                    console.log(`💬 Message: ${jsonData.message}`);
                                }
                                if (jsonData.status) {
                                    console.log(`📊 Status: ${jsonData.status}`);
                                }

                            } catch (parseError) {
                                // Handle non-JSON data
                                console.log('📄 Raw stream data:', data);
                            }
                        } else if (line.startsWith('event: ')) {
                            const eventType = line.slice(7); // Remove 'event: ' prefix
                            console.log('🎯 Event type:', eventType);
                        } else if (line.startsWith('id: ')) {
                            const eventId = line.slice(4); // Remove 'id: ' prefix
                            console.log('🆔 Event ID:', eventId);
                            // Also try to extract session ID from event ID if needed
                            if (!currentSessionId && eventId.includes('session')) {
                                currentSessionId = eventId;
                                console.log('💾 Extracted session ID from event ID:', currentSessionId);
                            }
                        } else {
                            // Handle other line formats
                            console.log('📝 Stream line:', line);
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            // Show completion state
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Completed`;
            console.log('✅ Workflow stream completed successfully');

        } else {
            // Fallback to regular JSON response
            const result = await response.json();
            console.log('Workflow triggered successfully:', result);

            // Show success state briefly
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Started`;

            // Update Status UI
            document.getElementById('status-title').innerText = `${mealType} Planning`;
            document.getElementById('status-subtitle').innerText = `Triggered manually just now`;

            // Switch Tab
            switchTab('status');
        }

        // Reset button after a brief delay
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 1500);

    } catch (error) {
        console.error('Error triggering workflow:', error);

        // Show error state
        btn.innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> Failed`;

        // Reset button after a longer delay for errors
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }, 3000);
    }
}

// --- 4. RENDER FUNCTIONS (UI COMPONENTS) ---

// Event Stream Rendering Functions
function renderEventInStream(eventData, timestamp) {
    const container = document.getElementById('event-stream-container');
    const eventElement = document.createElement('div');

    // Get event type and determine icon/styling
    const { type, calls, responses, text, isFinalResponse, workflow_status } = eventData;
    let icon, iconColor, title, subtitle, bgColor;

    // Handle different workflow statuses for TextResponse events
    if (type === 'TextResponse' && workflow_status && text) {
        if (workflow_status === 'AWAITING_USER_APPROVAL') {
            console.log('🎯 Detected AWAITING_USER_APPROVAL event, showing chat modal:', eventData);
            showChatModal(text, eventData);
        } else if (workflow_status === 'ORDER_CONFIRMED') {
            console.log('🎉 Detected ORDER_CONFIRMED event from stream, showing celebratory message:', eventData);
            showCelebratoryMessage(text);

            // Clean up polling and state when order is confirmed
            const currentUserId = getCurrentUserId();
            stopAllPolling();
            AppState.clearActiveSessionId();

            // Restart active sessions polling after a delay
            setTimeout(() => {
                if (currentUserId && currentUserId !== 'create_new') {
                    startActiveSessionsPolling(currentUserId);
                }
            }, 3000); // Wait a bit longer before restarting
        }
    }

    switch (type) {
        case 'ToolCall':
            icon = 'fa-cog';
            iconColor = 'text-blue-400';
            bgColor = 'bg-blue-500/10 border-blue-500/20';
            title = calls && calls.length > 0 ? calls.map(call => call.name).join(', ') : 'Tool Call';
            subtitle = calls && calls.length > 0 ? `Called ${calls.length} tool${calls.length > 1 ? 's' : ''}` : 'Executing tool';
            break;

        case 'ToolResponse':
            icon = 'fa-check-circle';
            iconColor = 'text-green-400';
            bgColor = 'bg-green-500/10 border-green-500/20';
            title = responses && responses.length > 0 ? responses.map(resp => resp.name).join(', ') : 'Tool Response';
            subtitle = responses && responses.length > 0 ?
                responses.map(resp => {
                    if (resp.response && resp.response.status) {
                        return `Status: ${resp.response.status}`;
                    }
                    return 'Completed';
                }).join(', ') : 'Response received';
            break;

        case 'TextResponse':
            icon = isFinalResponse ? 'fa-flag-checkered' : 'fa-comment';
            iconColor = isFinalResponse ? 'text-purple-400' : 'text-yellow-400';
            bgColor = isFinalResponse ? 'bg-purple-500/10 border-purple-500/20' : 'bg-yellow-500/10 border-yellow-500/20';
            title = isFinalResponse ? 'Final Response' : 'Text Response';
            subtitle = text ? (text.length > 100 ? text.substring(0, 100) + '...' : text) : 'Text response received';
            break;

        default:
            icon = 'fa-question-circle';
            iconColor = 'text-gray-400';
            bgColor = 'bg-gray-500/10 border-gray-500/20';
            title = type || 'Unknown Event';
            subtitle = 'Unknown event type';
    }

    eventElement.className = `border rounded-lg p-3 ${bgColor} border transition-all hover:shadow-md animate-fade-in`;

    eventElement.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid ${icon} ${iconColor} text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <h4 class="font-medium text-slate-200 text-sm">${title}</h4>
                    <span class="text-xs text-slate-500 font-mono">${timestamp}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">${subtitle}</p>
                ${text && type === 'TextResponse' ? `
                    <div class="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-300 border border-slate-700/50">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Insert at the beginning (newest events first)
    const firstChild = container.querySelector('.text-xs.text-slate-500') || container.firstChild;
    if (firstChild && firstChild.nextSibling) {
        container.insertBefore(eventElement, firstChild.nextSibling);
    } else {
        container.appendChild(eventElement);
    }

    // Auto-scroll to show newest events
    container.scrollTop = 0;
}

function clearEventStream() {
    const container = document.getElementById('event-stream-container');
    // Keep the header, remove all event elements
    const header = container.querySelector('.text-xs.text-slate-500');
    container.innerHTML = '';
    if (header) {
        container.appendChild(header);
    } else {
        container.innerHTML = '<div class="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">Agent Event Stream</div>';
    }
}

// Test function to demonstrate event rendering (can be removed in production)
function testEventStreamRendering() {
    // Sample events based on the untitled file structure
    const sampleEvents = [
        {
            "type": "ToolCall",
            "calls": [
                {
                    "name": "transfer_to_agent",
                    "arguments": {
                        "agent_name": "MealPlanner"
                    }
                }
            ],
            "workflow_status": "IDLE"
        },
        {
            "type": "ToolResponse",
            "responses": [
                {
                    "name": "transfer_to_agent",
                    "response": {
                        "result": null
                    }
                }
            ],
            "workflow_status": "IDLE"
        },
        {
            "type": "ToolCall",
            "calls": [
                {
                    "name": "restaurant_scout_agent",
                    "arguments": {
                        "request": "high-protein lunch for Tony Stark"
                    }
                }
            ],
            "workflow_status": "MEAL_PLANNING_STARTED"
        },
        {
            "type": "ToolResponse",
            "responses": [
                {
                    "name": "restaurant_scout_agent",
                    "response": {
                        "status": "success",
                        "message": "Found 3 restaurant options"
                    }
                }
            ],
            "workflow_status": "MEAL_PLANNING_STARTED"
        },
        {
            "type": "TextResponse",
            "isFinalResponse": true,
            "text": "Hi Tony! I have some delicious lunch options for you today:\n\n1. **Margherita Pizza** from The Italian Table - $12.99, 850 calories\n2. **Cheeseburger** from Burger Barn - $9.50, 750 calories\n3. **Gyro Plate** from Mediterranean Bites - $11.00, 850 calories\n\nPlease let me know which option you'd like, or if you have any feedback on these choices!",
            "workflow_status": "AWAITING_USER_APPROVAL",
            "session_id": "test-session-123"
        }
    ];

    // Set test session ID for this demo
    currentSessionId = "test-session-123";

    // Clear existing events
    clearEventStream();

    // Show the event stream
    const container = document.getElementById('event-stream-container');
    const icon = document.getElementById('expand-icon');
    const progress = document.getElementById('simple-progress');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        icon.classList.add('rotate-180');
        progress.style.opacity = '0';
    }

    // Render events with delay to simulate streaming
    sampleEvents.forEach((event, index) => {
        setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            renderEventInStream(event, timestamp);
        }, index * 1000); // 1 second delay between events
    });

    // Switch to status tab to show the events
    switchTab('status');
}

// Test function to simulate ORDER_CONFIRMED (for debugging)
function testOrderConfirmed() {
    console.log('🧪 Testing ORDER_CONFIRMED flow...');
    const orderConfirmedEvent = {
        "type": "TextResponse",
        "isFinalResponse": true,
        "text": "🎉 Great choice! Your Ribeye Steak order has been confirmed and is being prepared. Expected delivery time: 25-30 minutes. Order #12345.",
        "workflow_status": "ORDER_CONFIRMED",
        "session_id": "test-session-123"
    };

    // Simulate the event coming through the stream
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    renderEventInStream(orderConfirmedEvent, timestamp);
}

function displayActiveSessionFound(activeSessionsData) {
    console.log('📋 Displaying active session found:', activeSessionsData.active_sessions_count);
    const statusCard = document.getElementById('status-card');

    // Show the status card with active session info
    showStatusCardWithActiveSessionFound(activeSessionsData);

    // Update status to show session monitoring
    document.getElementById('status-title').innerText = 'Monitoring Active Session';
    document.getElementById('status-subtitle').innerText = `Found ${activeSessionsData.active_sessions_count} active session(s). Monitoring for updates...`;
}

function showStatusCardWithActiveSessionFound(activeSessionsData) {
    console.log('📋 Showing status card with active session found');
    const statusCard = document.getElementById('status-card');
    statusCard.style.display = 'block';

    // Update the content to show session monitoring
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');
    const statusIndicator = document.getElementById('status-indicator');
    const simpleProgress = document.getElementById('simple-progress');

    if (statusTitle) {
        statusTitle.innerText = 'Session Monitoring';
    }

    if (statusSubtitle) {
        statusSubtitle.innerText = `Monitoring ${activeSessionsData.active_sessions_count} active session(s) for updates...`;
    }

    if (statusIndicator) {
        statusIndicator.className = 'w-3 h-3 bg-blue-500 rounded-full animate-pulse';
    }

    if (simpleProgress) {
        simpleProgress.style.opacity = '1';
    }

    // Update the status header indicator
    const statusHeader = statusCard.querySelector('.text-xs.font-bold');
    if (statusHeader) {
        statusHeader.className = 'text-xs font-bold text-blue-400';
        statusHeader.innerText = '● MONITORING';
    }
}

function displayActiveSessions(activeSessionsData) {
    console.log('📋 Displaying active sessions:', activeSessionsData.active_sessions_count);
    const statusCard = document.getElementById('status-card');
    const activeSessionsContainer = document.getElementById('active-sessions-container');

    // Show the status card with active session info and event stream
    showStatusCardWithActiveSessions(activeSessionsData);

    // Create active sessions container if it doesn't exist
    if (!activeSessionsContainer) {
        const container = document.createElement('div');
        container.id = 'active-sessions-container';
        container.className = 'mb-6 space-y-4';

        // Insert before the status card
        statusCard.parentNode.insertBefore(container, statusCard);
    }

    // Show the active sessions container
    document.getElementById('active-sessions-container').style.display = 'block';

    // Clear existing content
    document.getElementById('active-sessions-container').innerHTML = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3';
    header.innerHTML = `
        <i class="fa-solid fa-circle-info text-blue-400 mt-1"></i>
        <div>
            <div class="text-sm text-blue-200 font-medium">Active Sessions Found</div>
            <div class="text-xs text-blue-300/80 mt-1">You have ${activeSessionsData.active_sessions_count} ongoing meal planning session(s). Click to resume.</div>
        </div>
    `;

    document.getElementById('active-sessions-container').appendChild(header);

    // Create session cards
    activeSessionsData.active_sessions.forEach((session, index) => {
        const sessionCard = createActiveSessionCard(session, index);
        document.getElementById('active-sessions-container').appendChild(sessionCard);
    });
}

function createActiveSessionCard(session, index) {
    const card = document.createElement('div');
    card.className = 'bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/20 cursor-pointer group';

    const state = session.state;
    const workflowStatus = state.workflow_status || 'UNKNOWN';
    const mealType = state.meal_type || 'Meal';
    const userName = state.user_name || 'User';

    // Format time
    const updateTime = new Date(session.update_time);
    const timeString = updateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Get status info
    const statusInfo = getStatusDisplayInfo(workflowStatus);

    card.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg ${statusInfo.bgColor} flex items-center justify-center ${statusInfo.textColor} transition-colors">
                    <i class="fa-solid ${statusInfo.icon} text-xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-200 group-hover:text-white transition-colors">${mealType} Planning</h3>
                    <div class="text-xs text-slate-500 mt-1">
                        <span class="inline-flex items-center gap-1">
                            <span class="w-2 h-2 ${statusInfo.dotColor} rounded-full"></span>
                            ${statusInfo.label}
                        </span>
                        <span class="mx-2">•</span>
                        <span>Updated at ${timeString}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <!-- <button onclick="resumeSession('${session.session_id}')" class="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <span>Resume</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button> -->
            </div>
        </div>
    `;

    return card;
}

function getStatusDisplayInfo(workflowStatus) {
    switch (workflowStatus) {
        case 'IDLE':
            return {
                icon: 'fa-play-circle',
                label: 'Initializing',
                bgColor: 'bg-blue-500/20',
                textColor: 'text-blue-400',
                dotColor: 'bg-blue-400'
            };
        case 'MEAL_PLANNING_STARTED':
            return {
                icon: 'fa-circle-notch fa-spin',
                label: 'Planning Meal',
                bgColor: 'bg-yellow-500/20',
                textColor: 'text-yellow-400',
                dotColor: 'bg-yellow-400'
            };
        case 'AWAITING_USER_APPROVAL':
            return {
                icon: 'fa-clock',
                label: 'Awaiting Your Response',
                bgColor: 'bg-orange-500/20',
                textColor: 'text-orange-400',
                dotColor: 'bg-orange-400'
            };
        case 'PROCESSING_USER_FEEDBACK':
            return {
                icon: 'fa-cogs fa-spin',
                label: 'Processing Response',
                bgColor: 'bg-purple-500/20',
                textColor: 'text-purple-400',
                dotColor: 'bg-purple-400'
            };
        default:
            return {
                icon: 'fa-question-circle',
                label: 'Unknown Status',
                bgColor: 'bg-gray-500/20',
                textColor: 'text-gray-400',
                dotColor: 'bg-gray-400'
            };
    }
}

function hideActiveSessionsDisplay() {
    console.log('🙈 Hiding active sessions display');
    const activeSessionsContainer = document.getElementById('active-sessions-container');
    if (activeSessionsContainer) {
        activeSessionsContainer.style.display = 'none';
        console.log('✅ Active sessions container hidden');
    }

    // Show the default status card and update it to show "no active sessions"
    showStatusCardWithNoActiveSessions();
}

function hideStatusCard() {
    console.log('🙈 Hiding status card');
    const statusCard = document.getElementById('status-card');
    statusCard.style.display = 'none';
}

function showStatusCard() {
    console.log('👁️ Showing status card');
    const statusCard = document.getElementById('status-card');
    statusCard.style.display = 'block';
}

function showStatusCardWithNoActiveSessions() {
    console.log('📋 Showing status card with no active sessions message');
    const statusCard = document.getElementById('status-card');
    statusCard.style.display = 'block';

    // Update the content to show no active sessions
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');
    const statusIndicator = document.getElementById('status-indicator');
    const simpleProgress = document.getElementById('simple-progress');

    if (statusTitle) {
        statusTitle.textContent = 'No Active Sessions';
        console.log('✅ Updated status title');
    }
    if (statusSubtitle) {
        statusSubtitle.textContent = 'No ongoing meal planning sessions found';
        console.log('✅ Updated status subtitle');
    }
    if (statusIndicator) {
        statusIndicator.innerHTML = '<i class="fa-solid fa-check-circle text-green-500 text-xl"></i>';
        console.log('✅ Updated status indicator');
    }
    if (simpleProgress) {
        simpleProgress.style.display = 'none';
        console.log('✅ Hidden progress bar');
    }

    // Update the status header indicator
    const statusHeader = statusCard.querySelector('.text-xs.font-bold.text-green-400');
    if (statusHeader) {
        statusHeader.innerHTML = '<span class="text-slate-500">●</span> Status';
        statusHeader.className = 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2';
        console.log('✅ Updated status header');
    }
}

function showStatusCardWithActiveSessions(activeSessionsData) {
    console.log('📋 Showing status card with active sessions and event stream');
    const statusCard = document.getElementById('status-card');
    statusCard.style.display = 'block';

    // Find the most recent active session to display in the status card
    const mostRecentSession = activeSessionsData.active_sessions[0]; // Sessions are ordered by update_time DESC
    const state = mostRecentSession.state;
    const workflowStatus = state.workflow_status || 'UNKNOWN';
    const mealType = state.meal_type || 'Meal';

    // Update the content to show active session info
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');
    const statusIndicator = document.getElementById('status-indicator');
    const simpleProgress = document.getElementById('simple-progress');

    if (statusTitle) {
        statusTitle.textContent = `${mealType} Planning`;
        console.log('✅ Updated status title for active session');
    }

    if (statusSubtitle) {
        const updateTime = new Date(mostRecentSession.update_time);
        const timeString = updateTime.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        statusSubtitle.textContent = `Last updated ${timeString}`;
        console.log('✅ Updated status subtitle for active session');
    }

    if (statusIndicator) {
        // Show spinning indicator for active sessions
        statusIndicator.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-primary-500 text-xl"></i>';
        console.log('✅ Updated status indicator for active session');
    }

    if (simpleProgress) {
        simpleProgress.style.display = 'block';
        console.log('✅ Shown progress bar for active session');
    }

    // Update the status header indicator
    const statusHeader = statusCard.querySelector('.text-xs.font-bold');
    if (statusHeader) {
        statusHeader.innerHTML = '<span class="animate-pulse">●</span> Active Session';
        statusHeader.className = 'text-xs font-bold text-green-400 uppercase tracking-widest mb-1 flex items-center gap-2';
        console.log('✅ Updated status header for active session');
    }
}

async function resumeSession(sessionId) {
    console.log(`Attempting to resume session: ${sessionId}`);
    // TODO: Implement session resume functionality
    // This would typically involve calling the resume API endpoint
    alert(`Resume functionality for session ${sessionId} will be implemented soon!`);
}

function renderDays() {
    const container = document.getElementById('days-container');
    days.forEach(day => {
        const btn = document.createElement('button');
        btn.className = `w-full aspect-square rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm hover:border-primary-500 hover:text-white transition-all flex items-center justify-center day-selector`;
        btn.innerText = day;
        btn.onclick = () => {
            if (btn.classList.contains('bg-primary-600')) {
                btn.className = `w-full aspect-square rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm hover:border-primary-500 hover:text-white transition-all flex items-center justify-center day-selector`;
            } else {
                btn.className = `w-full aspect-square rounded-full border-none bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-500/30 flex items-center justify-center day-selector`;
            }
        }
        container.appendChild(btn);
    });
}

function renderAllergies() {
    const container = document.getElementById('allergies-grid');
    allergiesList.forEach(item => {
        const div = document.createElement('div');
        div.className = "group cursor-pointer bg-slate-900 border border-slate-700 hover:border-primary-500/50 hover:bg-slate-800 rounded-xl p-3 flex flex-col items-center justify-center transition-all allergy-card";
        div.onclick = () => {
            div.classList.toggle('ring-2');
            div.classList.toggle('ring-primary-500');
            div.classList.toggle('bg-slate-800');
            div.classList.toggle('text-primary-400');
        };
        div.innerHTML = `
            <i class="fa-solid ${item.icon} text-xl mb-2 text-slate-500 group-hover:text-primary-400 transition-colors"></i>
            <span class="text-xs font-medium">${item.name}</span>
        `;
        container.appendChild(div);
    });
}

// Tabs Logic
function switchTab(tabName) {
    // Reset all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200";
    });

    // Activate current button
    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700 text-white shadow-sm";
    }

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

    // Show current section
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) activeView.classList.remove('hidden');

    // If switching to status tab, refresh active sessions
    if (tabName === 'status') {
        const currentUserId = getCurrentUserId();
        if (currentUserId && currentUserId !== 'create_new') {
            checkAndDisplayActiveSessions(currentUserId);
        }
    }
}

// Dynamic Meal Slots
function addMealSlot(type = "Lunch", start = "12:00", end = "13:00", customName = "") {
    const container = document.getElementById('meal-slots-container');
    const slot = document.createElement('div');
    slot.className = "flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 animate-fade-in";

    const isCustom = !['Breakfast', 'Lunch', 'Dinner'].includes(type);
    const customInputStyle = isCustom ? 'block' : 'none';
    const actualCustomName = isCustom ? (customName || type) : '';

    slot.innerHTML = `
        <select class="bg-slate-800 text-xs text-white p-2 rounded border border-slate-700 focus:border-primary-500 outline-none" onchange="toggleCustomNameInput(this)">
            <option ${type === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
            <option ${type === 'Lunch' ? 'selected' : ''}>Lunch</option>
            <option ${type === 'Dinner' ? 'selected' : ''}>Dinner</option>
            <option ${isCustom ? 'selected' : ''}>Custom</option>
        </select>
        <input type="text" placeholder="Custom meal name" value="${actualCustomName}" class="custom-meal-name bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 outline-none focus:border-primary-500" style="display: ${customInputStyle}; min-width: 120px;">
        <div class="text-slate-500 text-xs">from</div>
        <input type="time" value="${start}" class="bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 outline-none">
        <div class="text-slate-500 text-xs">to</div>
        <input type="time" value="${end}" class="bg-slate-800 text-white text-xs p-2 rounded border border-slate-700 outline-none">
        <button onclick="this.parentElement.remove()" class="ml-auto text-slate-500 hover:text-red-400 p-2">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    container.appendChild(slot);
}

// Toggle custom meal name input visibility
function toggleCustomNameInput(selectElement) {
    const slot = selectElement.parentElement;
    const customNameInput = slot.querySelector('.custom-meal-name');

    if (selectElement.value === 'Custom') {
        customNameInput.style.display = 'block';
        customNameInput.focus();
    } else {
        customNameInput.style.display = 'none';
        customNameInput.value = '';
    }
}

// Preference Tags
function addPreference() {
    const input = document.getElementById('pref-input');
    const text = input.value.trim();
    if (text) {
        addPreferenceTag(text);
        input.value = "";
    }
}

function addPreferenceTag(text) {
    const container = document.getElementById('pref-tags');
    const tag = document.createElement('div');
    tag.className = "bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-600 animate-fade-in";
    tag.innerHTML = `
        <span>${text}</span>
        <i onclick="this.parentElement.remove()" class="fa-solid fa-xmark cursor-pointer hover:text-white"></i>
    `;
    container.appendChild(tag);
}

// Mock History Data
function renderMockHistory() {
    const container = document.getElementById('history-container');
    const history = [
        { title: 'Dinner - Sushi', status: 'Delivered', time: 'Yesterday, 7:30 PM', color: 'text-green-400' },
        { title: 'Lunch - Burrito', status: 'Delivered', time: 'Yesterday, 1:15 PM', color: 'text-green-400' },
        { title: 'Lunch - Salad', status: 'Cancelled', time: 'Mon, 12:30 PM', color: 'text-red-400' },
    ];

    container.innerHTML = ''; // Clear existing
    history.forEach(h => {
        const item = document.createElement('div');
        item.className = "relative mb-6 last:mb-0";
        item.innerHTML = `
            <div class="absolute -left-[29px] top-1 w-3 h-3 bg-slate-600 rounded-full border-2 border-slate-900"></div>
            <div class="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800 transition-colors">
                <div class="flex justify-between items-start">
                    <h4 class="text-sm font-semibold text-slate-200">${h.title}</h4>
                    <span class="text-xs font-mono ${h.color}">${h.status}</span>
                </div>
                <div class="text-xs text-slate-500 mt-1">${h.time}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Save Profile to API
async function saveProfile() {
    const btn = document.getElementById('save-btn');
    const originalContent = btn.innerHTML;

    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Saving...`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
        // Determine user ID - use new user ID if creating new user
        const select = document.getElementById('user-select');
        let currentUserId;

        if (select.value === 'create_new') {
            currentUserId = select.dataset.newUserId || `user_${Date.now()}`;
        } else {
            currentUserId = select.value;
        }

        const userData = {
            id: currentUserId,
            name: document.getElementById('input-name').value,
            preferences: Array.from(document.querySelectorAll('#pref-tags > div')).map(tag => tag.querySelector('span').textContent),
            allergies: Array.from(document.querySelectorAll('.allergy-card.ring-2')).map(card => card.querySelector('span').textContent),
            schedule: {
                days: Array.from(document.querySelectorAll('.day-selector.bg-primary-600')).map((btn, index) => {
                    const allDayButtons = Array.from(document.querySelectorAll('.day-selector'));
                    const buttonIndex = allDayButtons.indexOf(btn);
                    return days[buttonIndex].toLowerCase();
                }),
                meals: Array.from(document.querySelectorAll('#meal-slots-container > div')).map(slot => {
                    const select = slot.querySelector('select');
                    const timeInputs = slot.querySelectorAll('input[type="time"]');
                    const customNameInput = slot.querySelector('.custom-meal-name');

                    let mealType = select.value;
                    if (mealType === 'Custom' && customNameInput && customNameInput.value.trim()) {
                        mealType = customNameInput.value.trim();
                    }

                    return {
                        type: mealType,
                        start: timeInputs[0].value,
                        end: timeInputs[1].value
                    };
                })
            },
            special_instructions: document.getElementById('input-instructions').value
        };

        // Save to API
        const result = await saveUserToAPI(userData);

        // Update state with saved user data
        AppState.upsertUser(userData);
        AppState.setCurrentUser(currentUserId);

        btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Saved Successfully`;
        btn.classList.remove('from-blue-600', 'to-blue-500');
        btn.classList.add('from-green-600', 'to-green-500');

        // If this was a new user, refresh the dropdown and select the new user
        if (select.value === 'create_new') {
            await populateUserDropdown();
            select.value = currentUserId;
        }

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.add('from-blue-600', 'to-blue-500');
            btn.classList.remove('from-green-600', 'to-green-500', 'opacity-75', 'cursor-not-allowed');
        }, 2000);

        console.log("Profile Saved Successfully:", result);
    } catch (error) {
        btn.innerHTML = `<i class="fa-solid fa-exclamation-triangle mr-2"></i> Save Failed`;
        btn.classList.remove('from-blue-600', 'to-blue-500');
        btn.classList.add('from-red-600', 'to-red-500');

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.add('from-blue-600', 'to-blue-500');
            btn.classList.remove('from-red-600', 'to-red-500', 'opacity-75', 'cursor-not-allowed');
        }, 3000);

        console.error("Error saving profile:", error);
    }
}