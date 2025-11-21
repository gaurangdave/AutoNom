// --- GLOBAL STATE MANAGEMENT ---
const AppState = {
    users: [],
    currentUser: null,
    currentUserId: null,
    isLoading: false,
    
    // Initialize state
    init() {
        this.users = [];
        this.currentUser = null;
        this.currentUserId = null;
        this.isLoading = false;
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
    renderMockHistory();
    
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
    if(!user) return;

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
            // Add to Profile
            addMealSlot(meal.type, meal.start, meal.end);
            
            // Add to Meals Tab
            renderSavedMealCard(meal);
        });
    }

    // Simulate "Fetching" effect
    document.body.classList.add('opacity-50');
    setTimeout(() => document.body.classList.remove('opacity-50'), 200);
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
    window.chatModalKeyHandler = function(e) {
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
        
        // Close modal
        closeChatModal();
        
        // Handle the resumed event stream
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            console.log('📡 Resuming event stream with user response...');
            
            // Handle the event stream similar to triggerPlan
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
                                
                            } catch (parseError) {
                                console.log('📄 Raw resumed stream data:', data);
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }
        
    } catch (error) {
        console.error('Error submitting chat response:', error);
        alert('Failed to send response. Please try again.');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalBtnContent;
        submitBtn.disabled = false;
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
    
    // Check for user approval requirement
    if (type === 'TextResponse' && workflow_status === 'AWAITING_USER_APPROVAL' && text) {
        console.log('🎯 Detected AWAITING_USER_APPROVAL event, showing chat modal:', eventData);
        showChatModal(text, eventData);
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
            "workflow_status": "INITIALIZE"
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
            "workflow_status": "INITIALIZE"
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

function renderDays() {
    const container = document.getElementById('days-container');
    days.forEach(day => {
        const btn = document.createElement('button');
        btn.className = `w-full aspect-square rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-bold text-sm hover:border-primary-500 hover:text-white transition-all flex items-center justify-center day-selector`;
        btn.innerText = day;
        btn.onclick = () => {
            if(btn.classList.contains('bg-primary-600')) {
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
    if(activeBtn) {
        activeBtn.className = "tab-btn flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700 text-white shadow-sm";
    }

    // Hide all sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // Show current section
    const activeView = document.getElementById(`view-${tabName}`);
    if(activeView) activeView.classList.remove('hidden');
}

// Dynamic Meal Slots
function addMealSlot(type = "Lunch", start = "12:00", end = "13:00") {
    const container = document.getElementById('meal-slots-container');
    const slot = document.createElement('div');
    slot.className = "flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 animate-fade-in";
    slot.innerHTML = `
        <select class="bg-slate-800 text-xs text-white p-2 rounded border border-slate-700 focus:border-primary-500 outline-none">
            <option ${type === 'Breakfast' ? 'selected' : ''}>Breakfast</option>
            <option ${type === 'Lunch' ? 'selected' : ''}>Lunch</option>
            <option ${type === 'Dinner' ? 'selected' : ''}>Dinner</option>
            <option ${!['Breakfast','Lunch','Dinner'].includes(type) ? 'selected' : ''}>${!['Breakfast','Lunch','Dinner'].includes(type) ? type : 'Custom'}</option>
        </select>
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

// Preference Tags
function addPreference() {
    const input = document.getElementById('pref-input');
    const text = input.value.trim();
    if(text) {
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
                    return {
                        type: select.value,
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