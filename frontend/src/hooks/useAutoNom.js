import { useState, useCallback } from 'react';
import axios from 'axios';

// Helper to convert API format to frontend format
const transformAPIUserToFrontend = (apiUser) => {
  if (!apiUser) return null;
  
  // Convert schedule.days array to boolean array [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
  // API format uses unambiguous identifiers: "m", "tu", "w", "th", "f", "sa", "su"
  // For backwards compatibility with old data, support ambiguous single-letter formats
  const scheduleBooleans = [false, false, false, false, false, false, false];
  
  if (apiUser.schedule?.days && Array.isArray(apiUser.schedule.days)) {
    // Map day abbreviations to indices (Monday=0, Sunday=6)
    const dayMap = { 
      'm': 0,      // Monday
      'tu': 1,     // Tuesday
      'w': 2,      // Wednesday
      'th': 3,     // Thursday
      'f': 4,      // Friday
      'sa': 5,     // Saturday
      'su': 6      // Sunday
    };
    
    // Track ambiguous 't' values for backward compatibility with old database data
    const ambiguousTCount = apiUser.schedule.days.filter(d => d.toLowerCase().trim() === 't').length;
    let tProcessed = 0;
    
    apiUser.schedule.days.forEach((day) => {
      const dayLower = day.toLowerCase().trim();
      let index = dayMap[dayLower];
      
      // Handle legacy ambiguous format: 't' could be Tuesday or Thursday
      // If multiple 't' values exist, treat first as Tuesday, second as Thursday
      if (dayLower === 't') {
        if (ambiguousTCount > 1 && tProcessed === 0) {
          index = 1; // First 't' = Tuesday
        } else if (ambiguousTCount > 1 && tProcessed === 1) {
          index = 3; // Second 't' = Thursday
        } else {
          index = 1; // Single 't' = Tuesday (default)
        }
        tProcessed++;
      }
      // Handle legacy ambiguous format: 's' could be Saturday or Sunday
      else if (dayLower === 's') {
        index = 5; // Default 's' to Saturday
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
  
  // Convert boolean array to unambiguous day identifiers
  // Frontend: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
  // API: ["m", "tu", "w", "th", "f", "sa", "su"]
  const dayNames = ['m', 'tu', 'w', 'th', 'f', 'sa', 'su'];
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

  // Fetch all sessions for a user
  const fetchUserSessions = useCallback(async (userId) => {
    try {
      const response = await axios.get(`/api/users/${userId}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return null;
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
      console.log('[useAutoNom] Submitting user response:', { userId, sessionId, userResponse });
      const response = await axios.post(
        `/api/sessions/${sessionId}/resume?streaming=false`,
        { choice: userResponse }
      );
      
      console.log('[useAutoNom] Resume response:', response.data);
      
      if (response.data) {
        // Add event to log
        const eventData = {
          type: 'UserResponseSubmitted',
          session_id: response.data.session_id,
          workflow_status: response.data.workflow_status,
          user_id: response.data.user_id,
          user_choice: response.data.user_choice,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
        
        setEventLog(prev => [...prev, eventData]);
      }
      
      return response.data;
    } catch (error) {
      console.error('[useAutoNom] Error submitting user response:', error);
      throw error;
    }
  }, []);

  // Trigger plan with non-streaming API
  const triggerPlan = useCallback(async (userId, mealType, onEvent, onComplete, onError) => {
    setIsProcessing(true);
    setEventLog([]);
    
    try {
      console.log('[useAutoNom] Triggering plan:', { userId, mealType });
      const response = await axios.post(
        `/api/users/${userId}/meals/${mealType}/trigger?streaming=false`
      );

      console.log('[useAutoNom] Trigger response:', response.data);

      if (response.data) {
        const { session_id, workflow_status } = response.data;
        
        console.log('[useAutoNom] Setting session ID:', session_id);
        
        // Store session ID
        if (session_id) {
          setCurrentSessionId(session_id);
          console.log('[useAutoNom] Session ID set to:', session_id);
        }

        // Add event to log
        const eventData = {
          type: 'WorkflowStarted',
          session_id,
          workflow_status,
          user_id: userId,
          meal_type: mealType,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };

        setEventLog(prev => [...prev, eventData]);

        // Call the event handler
        if (onEvent) onEvent(eventData);
        
        setIsProcessing(false);
        if (onComplete) onComplete(response.data);
      }
    } catch (error) {
      console.error('[useAutoNom] Error in triggerPlan:', error);
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
    fetchUserSessions,
    fetchActiveSessionsForUser,
    fetchSessionState,
    submitUserResponse,
    triggerPlan,
    setEventLog,
    setCurrentSessionId
  };
};
