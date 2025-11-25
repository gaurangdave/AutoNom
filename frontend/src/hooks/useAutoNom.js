import { useState, useCallback } from 'react';
import axios from 'axios';

// Helper to convert API format to frontend format
const transformAPIUserToFrontend = (apiUser) => {
  if (!apiUser) return null;
  
  // Convert schedule.days array ["m", "t", "w", "t"] to boolean array [true, true, true, true, false, false, false]
  // API format: "m" = Monday, "t" = Tuesday, "w" = Wednesday, "th" = Thursday, "f" = Friday, "s" = Saturday, "su" = Sunday
  // But the API returns ["m", "t", "w", "t"] which seems wrong - let's assume it's positional
  const scheduleBooleans = [false, false, false, false, false, false, false];
  
  if (apiUser.schedule?.days && Array.isArray(apiUser.schedule.days)) {
    // Try to match each day string to the day of week
    const dayMap = { 
      'm': 0,      // Monday
      'tu': 1,     // Tuesday  
      't': 1,      // Tuesday (alternate)
      'w': 2,      // Wednesday
      'th': 3,     // Thursday
      'f': 4,      // Friday
      's': 5,      // Saturday
      'sa': 5,     // Saturday (alternate)
      'su': 6      // Sunday
    };
    
    apiUser.schedule.days.forEach((day) => {
      const dayLower = day.toLowerCase().trim();
      let index = dayMap[dayLower];
      
      // If we have multiple 't' values, assume they are sequential (t, th)
      if (dayLower === 't') {
        // Check if we already have Tuesday selected
        if (scheduleBooleans[1]) {
          index = 3; // Make it Thursday
        }
      }
      
      if (index !== undefined) {
        scheduleBooleans[index] = true;
      }
    });
  }
  
  // Convert meals and ensure each has an id
  const meals = (apiUser.schedule?.meals || []).map((meal, index) => ({
    ...meal,
    id: meal.id || `meal_${apiUser.id}_${index}_${Date.now()}`
  }));
  
  return {
    user_id: apiUser.id,
    name: apiUser.name,
    preferences: apiUser.preferences || [],
    allergies: apiUser.allergies || [],
    schedule: scheduleBooleans,
    meals: meals,
    instructions: apiUser.special_instructions || ''
  };
};

// Helper to convert frontend format to API format
const transformFrontendUserToAPI = (frontendUser) => {
  if (!frontendUser) return null;
  
  // Convert boolean array [true, true, true, true, false, false, false] to days array ["m", "t", "w", "th"]
  const dayNames = ['m', 't', 'w', 'th', 'f', 's', 'su'];
  const selectedDays = [];
  frontendUser.schedule.forEach((isSelected, index) => {
    if (isSelected) {
      selectedDays.push(dayNames[index]);
    }
  });
  
  return {
    id: frontendUser.user_id,
    name: frontendUser.name,
    preferences: frontendUser.preferences || [],
    allergies: frontendUser.allergies || [],
    schedule: {
      days: selectedDays,
      meals: frontendUser.meals || []
    },
    special_instructions: frontendUser.instructions || ''
  };
};

export const useAutoNom = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users');
      // Transform API format to frontend format
      const users = response.data.map(transformAPIUserToFrontend);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }, []);

  // Save user profile
  const saveUserToAPI = useCallback(async (userData) => {
    try {
      // Transform frontend format to API format
      const apiData = transformFrontendUserToAPI(userData);
      const response = await axios.post('/api/users', apiData);
      // Transform response back to frontend format
      return transformAPIUserToFrontend(response.data);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }, []);

  // Fetch active sessions for a user
  const fetchActiveSessionsForUser = useCallback(async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/active-sessions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return null;
    }
  }, []);

  // Fetch session state
  const fetchSessionState = useCallback(async (userId, sessionId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/active-sessions/${sessionId}/state`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session state:', error);
      return null;
    }
  }, []);

  // Submit user response to approval
  const submitUserResponse = useCallback(async (userId, sessionId, userResponse) => {
    try {
      const response = await axios.post(`/api/sessions/${sessionId}/resume`, {
        choice: userResponse
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting user response:', error);
      throw error;
    }
  }, []);

  // Trigger plan with streaming events
  const triggerPlan = useCallback(async (userId, mealType, onEvent, onComplete, onError) => {
    setIsProcessing(true);
    setEventLog([]);
    
    try {
      const response = await fetch(`/api/users/${userId}/meals/${mealType}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsProcessing(false);
              if (onComplete) onComplete();
              continue;
            }

            try {
              const eventData = JSON.parse(data);
              
              // Store session ID if present
              if (eventData.session_id) {
                setCurrentSessionId(eventData.session_id);
              }

              // Add event to log
              setEventLog(prev => [...prev, {
                ...eventData,
                timestamp: new Date().toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              }]);

              // Call the event handler
              if (onEvent) onEvent(eventData);

            } catch (err) {
              console.error('Error parsing event:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in triggerPlan:', error);
      setIsProcessing(false);
      if (onError) onError(error);
    }
  }, []);

  return {
    isProcessing,
    eventLog,
    currentSessionId,
    fetchUsers,
    saveUserToAPI,
    fetchActiveSessionsForUser,
    fetchSessionState,
    submitUserResponse,
    triggerPlan,
    setEventLog,
    setCurrentSessionId
  };
};
