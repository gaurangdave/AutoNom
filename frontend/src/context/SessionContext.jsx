import { createContext, useEffect, useRef } from 'react';
import { useUser } from '../hooks/useUser';
import { useAutoNom } from '../hooks/useAutoNom';
import { useStatusStore } from '../stores/statusStore';
import { WORKFLOW_STATUS, POLLING_INTERVALS, getStatusDisplay } from '../utils/constants';
import { createLogger } from '../utils/logger';
import {
  getWorkflowStatus,
  getMealChoiceVerificationMessage,
  getMealChoices,
  getOrderConfirmation
} from '../utils/sessionAccessors';

const logger = createLogger('SessionProvider');

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const { getCurrentUserId, activeSessionId, setActiveSessionId } = useUser();
  const { fetchSessionState, fetchUserSessions } = useAutoNom();
  
  const {
    showModal,
    celebrationShownForSession,
    setSessionHistory,
    setStatusTitle,
    setStatusSubtitle,
    setIsActive,
    setModalMessage,
    setModalMealChoices,
    setShowModal,
    setCelebrationMessage,
    setShowCelebration,
    setCelebrationShownForSession,
    setCurrentSessionState,
    resetForNewSession,
  } = useStatusStore();

  const pollIntervalRef = useRef(null);
  const historyPollIntervalRef = useRef(null);
  const previousWorkflowStatusRef = useRef(null);
  const sessionHistoryRef = useRef([]);

  // Fetch session history - only poll when there's no active session
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const loadSessionHistory = async () => {
      try {
        const data = await fetchUserSessions(userId);
        if (data && data.sessions) {
          // Sort sessions by create_time, newest first
          const sortedSessions = [...data.sessions].sort((a, b) => 
            new Date(b.create_time) - new Date(a.create_time)
          );
          setSessionHistory(sortedSessions);
          // Sync ref with store
          sessionHistoryRef.current = sortedSessions;
        }
      } catch (error) {
        logger.error('Error loading session history:', error);
      }
    };

    // Clear any existing history polling interval
    if (historyPollIntervalRef.current) {
      clearInterval(historyPollIntervalRef.current);
      historyPollIntervalRef.current = null;
    }

    // Load history immediately
    loadSessionHistory();
    
    // Only poll session history if there's NO active session
    if (!activeSessionId) {
      logger.log('No active session, starting history polling');
      historyPollIntervalRef.current = setInterval(loadSessionHistory, POLLING_INTERVALS.SESSION_HISTORY);
    } else {
      logger.log('Active session exists, skipping history polling');
    }
    
    return () => {
      if (historyPollIntervalRef.current) {
        clearInterval(historyPollIntervalRef.current);
        historyPollIntervalRef.current = null;
      }
    };
  }, [getCurrentUserId, fetchUserSessions, activeSessionId, setSessionHistory]);

  // Auto-set active session from history if not already set
  useEffect(() => {
    const sessionHistory = useStatusStore.getState().sessionHistory;
    
    if (!activeSessionId && sessionHistory.length > 0) {
      // Find the latest session that's not ORDER_CONFIRMED
      const latestActiveSession = sessionHistory.find(
        session => getWorkflowStatus(session) !== WORKFLOW_STATUS.ORDER_CONFIRMED
      );
      
      if (latestActiveSession) {
        logger.log('Auto-setting active session from history:', latestActiveSession.session_id);
        setActiveSessionId(latestActiveSession.session_id);
      }
    }
  }, [activeSessionId, setActiveSessionId]);

  // Poll for session state when activeSessionId changes
  useEffect(() => {
    const userId = getCurrentUserId();
    
    logger.log('Session polling effect triggered:', { activeSessionId, userId });
    
    // Clear any existing session state polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // If no valid session or no user, stop polling
    if (!activeSessionId || !userId) {
      logger.log('No session or user, stopping session state polling');
      return;
    }

    logger.log('Active session ID detected:', activeSessionId);
    
    // Reset user feedback flag and previous workflow status for new session
    resetForNewSession();
    previousWorkflowStatusRef.current = null;
    
    // Stop history polling when we start session state polling
    if (historyPollIntervalRef.current) {
      logger.log('Stopping history polling to start session state polling');
      clearInterval(historyPollIntervalRef.current);
      historyPollIntervalRef.current = null;
    }

    // Function to poll session state
    const pollSessionState = async () => {
      try {
        logger.log('Polling session state for:', { userId, activeSessionId });
        const sessionState = await fetchSessionState(userId, activeSessionId);
        logger.log('Session state response:', sessionState);
        
        if (sessionState && sessionState.state) {
          const workflowStatus = getWorkflowStatus(sessionState);
          const previousStatus = previousWorkflowStatusRef.current;
          logger.log('Workflow status:', workflowStatus, 'Previous:', previousStatus);
          
          // Update Zustand store with session state
          setCurrentSessionState(sessionState);
          
          // Update session history with latest session state using ref to avoid re-render loop
          sessionHistoryRef.current = sessionHistoryRef.current || [];
          const sessionIndex = sessionHistoryRef.current.findIndex(s => s.session_id === activeSessionId);
          
          if (sessionIndex >= 0) {
            // Update existing session
            sessionHistoryRef.current[sessionIndex] = sessionState;
          } else {
            // Add new session to history
            sessionHistoryRef.current = [sessionState, ...sessionHistoryRef.current];
          }
          
          // Update Zustand store with the updated history
          setSessionHistory([...sessionHistoryRef.current]);
          
          // Get display info from helper function
          const statusDisplay = getStatusDisplay(workflowStatus);
          setStatusTitle(statusDisplay.title);
          setStatusSubtitle(statusDisplay.subtitle);
          setIsActive(statusDisplay.isActive);
          
          // Check for state transition from MEAL_PLANNING_COMPLETE to AWAITING_USER_APPROVAL
          const isTransitionToApproval = 
            previousStatus === WORKFLOW_STATUS.MEAL_PLANNING_COMPLETE && 
            workflowStatus === WORKFLOW_STATUS.AWAITING_USER_APPROVAL;
          
          // Show modal ONLY on edge trigger (state transition)
          if (workflowStatus === WORKFLOW_STATUS.AWAITING_USER_APPROVAL) {
            const message = getMealChoiceVerificationMessage(sessionState);
            const mealChoices = getMealChoices(sessionState);
            
            if (message && isTransitionToApproval && !showModal) {
              logger.log('Edge trigger detected: MEAL_PLANNING_COMPLETE -> AWAITING_USER_APPROVAL');
              logger.log('Showing approval modal with message and meal choices');
              setModalMessage(message);
              setModalMealChoices(mealChoices);
              setShowModal(true);
              
              // Stop polling while modal is open
              if (pollIntervalRef.current) {
                logger.log('Pausing polling while modal is open');
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          } else if (workflowStatus === WORKFLOW_STATUS.ORDER_CONFIRMED) {
            // Show celebration popup with order confirmation message (only once per session)
            const message = getOrderConfirmation(sessionState) || 'Your meal order has been successfully placed!';
            if (celebrationShownForSession !== activeSessionId) {
              logger.log('Showing celebration popup for session:', activeSessionId);
              setCelebrationMessage(message);
              setShowCelebration(true);
              setCelebrationShownForSession(activeSessionId);
              setTimeout(() => setShowCelebration(false), POLLING_INTERVALS.CELEBRATION_DISPLAY);
            }
            
            // Stop session state polling once order is confirmed
            logger.log('Order confirmed, stopping session state polling');
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            // Clear active session so history polling can resume
            setActiveSessionId(null);
          }
          
          // Update previous workflow status for next poll (edge trigger detection)
          previousWorkflowStatusRef.current = workflowStatus;
        }
      } catch (error) {
        logger.error('Error polling session state:', error);
      }
    };

    // Poll immediately
    logger.log('Starting immediate poll and setting up interval');
    pollSessionState();
    
    // Set up polling interval
    pollIntervalRef.current = setInterval(pollSessionState, POLLING_INTERVALS.SESSION_STATE);

    // Cleanup on unmount or when dependencies change
    return () => {
      logger.log('Cleaning up session state polling interval');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [
    activeSessionId,
    getCurrentUserId,
    fetchSessionState,
    showModal,
    celebrationShownForSession,
    setActiveSessionId,
    resetForNewSession,
    setStatusTitle,
    setStatusSubtitle,
    setIsActive,
    setModalMessage,
    setModalMealChoices,
    setShowModal,
    setCelebrationMessage,
    setShowCelebration,
    setCelebrationShownForSession,
    setCurrentSessionState,
    setSessionHistory
  ]);

  // Method to resume polling after feedback submission
  const resumePollingAfterFeedback = (sessionId, onStatusUpdate) => {
    const userId = getCurrentUserId();
    
    if (!userId || !sessionId) return;
    
    // Resume polling after a delay to give backend time to process
    setTimeout(() => {
      if (!pollIntervalRef.current && activeSessionId) {
        logger.log('Resuming polling after feedback submission');
        
        const resumedPollSessionState = async () => {
          try {
            const sessionState = await fetchSessionState(userId, sessionId);
            if (sessionState && sessionState.state) {
              const workflowStatus = getWorkflowStatus(sessionState);
              logger.log('Resumed polling - workflow status:', workflowStatus);
              
              // Update store with new session state
              setCurrentSessionState(sessionState);
              
              // Get display info and update store
              const statusDisplay = getStatusDisplay(workflowStatus);
              setStatusTitle(statusDisplay.title);
              setStatusSubtitle(statusDisplay.subtitle);
              setIsActive(statusDisplay.isActive);
              
              // Notify callback if provided
              if (onStatusUpdate) {
                onStatusUpdate(workflowStatus, sessionState);
              }
              
              if (workflowStatus === WORKFLOW_STATUS.ORDER_CONFIRMED) {
                const message = getOrderConfirmation(sessionState) || 'Your meal order has been successfully placed!';
                if (celebrationShownForSession !== sessionId) {
                  setCelebrationMessage(message);
                  setShowCelebration(true);
                  setCelebrationShownForSession(sessionId);
                  setTimeout(() => setShowCelebration(false), POLLING_INTERVALS.CELEBRATION_DISPLAY);
                }
                
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }
                setActiveSessionId(null);
              }
            }
          } catch (error) {
            logger.error('Error in resumed polling:', error);
          }
        };
        
        resumedPollSessionState();
        pollIntervalRef.current = setInterval(resumedPollSessionState, POLLING_INTERVALS.SESSION_STATE);
      }
    }, POLLING_INTERVALS.RESUME_AFTER_FEEDBACK);
  };

  const value = {
    resumePollingAfterFeedback
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export { SessionContext };
