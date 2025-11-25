import { useState, useCallback } from 'react';
import axios from 'axios';

export const useAutoNom = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }, []);

  // Save user profile
  const saveUserToAPI = useCallback(async (userData) => {
    try {
      const response = await axios.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }, []);

  // Fetch active sessions for a user
  const fetchActiveSessionsForUser = useCallback(async (userId) => {
    try {
      const response = await axios.get(`/api/sessions/active/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return null;
    }
  }, []);

  // Fetch session state
  const fetchSessionState = useCallback(async (userId, sessionId) => {
    try {
      const response = await axios.get(`/api/sessions/${userId}/${sessionId}/state`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session state:', error);
      return null;
    }
  }, []);

  // Submit user response to approval
  const submitUserResponse = useCallback(async (userId, sessionId, userResponse) => {
    try {
      const response = await axios.post('/api/user_approval', {
        user_id: userId,
        session_id: sessionId,
        user_response: userResponse
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
      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          meal_type: mealType
        })
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
