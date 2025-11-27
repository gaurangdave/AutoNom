import { useEffect, useRef } from 'react';
import { Info, PartyPopper } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import { WORKFLOW_STATUS, getStatusDisplay } from '../../utils/constants';
import { useStatusStore } from '../../stores/statusStore';
import StatusCard from '../status/StatusCard';
import SelectionModal from '../status/SelectionModal';
import SessionHistory from '../status/SessionHistory';

const StatusTab = () => {
  const { getCurrentUserId, activeSessionId, setActiveSessionId } = useUser();
  const toast = useToast();
  const { 
    eventLog, 
    fetchSessionState,
    fetchUserSessions,
    submitUserResponse
  } = useAutoNom();

  // Zustand store
  const {
    statusTitle,
    statusSubtitle,
    isActive,
    showModal,
    modalMessage,
    modalMealChoices,
    showCelebration,
    celebrationMessage,
    sessionHistory,
    selectedSessionForChat,
    celebrationShownForSession,
    userFeedbackReceived,
    currentSessionState,
    currentWorkflowStatus,
    setSessionHistory,
    setStatusTitle,
    setStatusSubtitle,
    setIsActive,
    setModalMessage,
    setModalMealChoices,
    setShowModal,
    setShowCelebration,
    setCelebrationMessage,
    setCelebrationShownForSession,
    setSelectedSessionForChat,
    setUserFeedbackReceived,
    setCurrentSessionState,
    closeModal,
    markFeedbackReceived,
    resetForNewSession  } = useStatusStore();

  const pollIntervalRef = useRef(null);
  const historyPollIntervalRef = useRef(null);
  const feedbackSubmittedTimeRef = useRef(null);
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
        console.error('[StatusTab] Error loading session history:', error);
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
      console.log('[StatusTab] No active session, starting history polling');
      historyPollIntervalRef.current = setInterval(loadSessionHistory, 10000);
    } else {
      console.log('[StatusTab] Active session exists, skipping history polling');
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
    if (!activeSessionId && sessionHistory.length > 0) {
      // Find the latest session that's not ORDER_CONFIRMED
      const latestActiveSession = sessionHistory.find(
        session => session.state?.workflow_status !== WORKFLOW_STATUS.ORDER_CONFIRMED
      );
      
      if (latestActiveSession) {
        console.log('[StatusTab] Auto-setting active session from history:', latestActiveSession.session_id);
        setActiveSessionId(latestActiveSession.session_id);
      }
    }
  }, [activeSessionId, sessionHistory, setActiveSessionId]);

  // Monitor event log for state changes
  useEffect(() => {
    if (eventLog.length > 0) {
      const latestEvent = eventLog[eventLog.length - 1];
      
      // Update status based on workflow status
      if (latestEvent.workflow_status === WORKFLOW_STATUS.AWAITING_USER_APPROVAL && latestEvent.text) {
        setStatusTitle('Awaiting Your Approval');
        setStatusSubtitle('The agent needs your input to continue');
        setIsActive(true);
        
        // Show modal for approval
        setModalMessage(latestEvent.text);
        setShowModal(true);
      } else if (latestEvent.workflow_status === WORKFLOW_STATUS.ORDER_CONFIRMED) {
        setStatusTitle('Order Confirmed! 🎉');
        setStatusSubtitle('Your meal has been successfully ordered');
        setIsActive(false);
        
        // Show celebration only once per session
        if (latestEvent.text && latestEvent.session_id && celebrationShownForSession !== latestEvent.session_id) {
          setCelebrationMessage(latestEvent.text);
          setShowCelebration(true);
          setCelebrationShownForSession(latestEvent.session_id);
          setTimeout(() => setShowCelebration(false), 10000);
        }
      } else if (latestEvent.workflow_status === WORKFLOW_STATUS.MEAL_PLANNING_STARTED) {
        setStatusTitle('Planning Your Meal');
        setStatusSubtitle('Finding the best options for you...');
        setIsActive(true);
      } else if (latestEvent.workflow_status === WORKFLOW_STATUS.ORDER_EXECUTION_STARTED) {
        setStatusTitle('Placing Your Order');
        setStatusSubtitle('Executing the order...');
        setIsActive(true);
      } else if (latestEvent.workflow_status === WORKFLOW_STATUS.COMPLETED) {
        setStatusTitle('Session Completed');
        setStatusSubtitle('All done!');
        setIsActive(false);
      }
    } else {
      setStatusTitle('No Active Session');
      setStatusSubtitle('Start a meal plan from the Meals tab');
      setIsActive(false);
    }
  }, [eventLog, celebrationShownForSession, setStatusTitle, setStatusSubtitle, setIsActive, setModalMessage, setShowModal, setCelebrationMessage, setShowCelebration, setCelebrationShownForSession]);

  // Poll for session state when activeSessionId changes
  useEffect(() => {
    const userId = getCurrentUserId();
    
    console.log('[StatusTab] Session polling effect triggered:', { activeSessionId, userId });
    
    // Clear any existing session state polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // If no valid session or no user, stop polling
    if (!activeSessionId || !userId) {
      console.log('[StatusTab] No session or user, stopping session state polling');
      return;
    }

    console.log('[StatusTab] Active session ID detected:', activeSessionId);
    
    // Reset user feedback flag and previous workflow status for new session
    resetForNewSession();
    feedbackSubmittedTimeRef.current = null;
    previousWorkflowStatusRef.current = null;
    
    // Stop history polling when we start session state polling
    if (historyPollIntervalRef.current) {
      console.log('[StatusTab] Stopping history polling to start session state polling');
      clearInterval(historyPollIntervalRef.current);
      historyPollIntervalRef.current = null;
    }

    // Function to poll session state
    const pollSessionState = async () => {
      try {
        console.log('[StatusTab] Polling session state for:', { userId, activeSessionId });
        const sessionState = await fetchSessionState(userId, activeSessionId);
        console.log('[StatusTab] Session state response:', sessionState);
        
        if (sessionState && sessionState.state) {
          const workflowStatus = sessionState.state.workflow_status;
          const previousStatus = previousWorkflowStatusRef.current;
          console.log('[StatusTab] Workflow status:', workflowStatus, 'Previous:', previousStatus);
          
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
            const message = sessionState.state.meal_choice_verification_message;
            const mealChoices = sessionState.state.meal_choices || [];
            
            if (message && isTransitionToApproval && !showModal) {
              console.log('[StatusTab] Edge trigger detected: MEAL_PLANNING_COMPLETE -> AWAITING_USER_APPROVAL');
              console.log('[StatusTab] Showing approval modal with message and meal choices');
              setModalMessage(message);
              setModalMealChoices(mealChoices);
              setShowModal(true);
              
              // Stop polling while modal is open
              if (pollIntervalRef.current) {
                console.log('[StatusTab] Pausing polling while modal is open');
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          } else if (workflowStatus === WORKFLOW_STATUS.ORDER_CONFIRMED) {
            // Show celebration popup with order confirmation message (only once per session)
            const message = sessionState.state.order_confirmation_message || 'Your meal order has been successfully placed!';
            if (celebrationShownForSession !== activeSessionId) {
              console.log('[StatusTab] Showing celebration popup for session:', activeSessionId);
              setCelebrationMessage(message);
              setShowCelebration(true);
              setCelebrationShownForSession(activeSessionId);
              setTimeout(() => setShowCelebration(false), 10000);
            }
            
            // Stop session state polling once order is confirmed
            console.log('[StatusTab] Order confirmed, stopping session state polling');
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
        console.error('[StatusTab] Error polling session state:', error);
      }
    };

    // Poll immediately
    console.log('[StatusTab] Starting immediate poll and setting up interval');
    pollSessionState();
    
    // Set up polling interval (every 3 seconds)
    pollIntervalRef.current = setInterval(pollSessionState, 3000);

    // Cleanup on unmount or when dependencies change
    return () => {
      console.log('[StatusTab] Cleaning up session state polling interval');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeSessionId, getCurrentUserId, fetchSessionState, showModal, celebrationShownForSession, setActiveSessionId, userFeedbackReceived, resetForNewSession, setStatusTitle, setStatusSubtitle, setIsActive, setModalMessage, setModalMealChoices, setShowModal, setCelebrationMessage, setShowCelebration, setCelebrationShownForSession, setCurrentSessionState, setSessionHistory]);

  const handleChatClick = (session) => {
    const message = session.state?.meal_choice_verification_message;
    const mealChoices = session.state?.meal_choices || [];
    if (message) {
      setSelectedSessionForChat(session);
      setModalMessage(message);
      setModalMealChoices(mealChoices);
      setShowModal(true);
    }
  };

  const handleModalSubmit = (response) => {
    const userId = getCurrentUserId();
    
    // Use selected session from history if available, otherwise use active session
    const sessionId = selectedSessionForChat?.session_id || activeSessionId;
    
    if (!userId || !sessionId) {
      toast.error('Session information not available');
      return;
    }

    // Close modal and mark this message as responded to
    markFeedbackReceived(modalMessage);

    // Submit in the background
    submitUserResponse(userId, sessionId, response)
      .then(() => {
        console.log('[StatusTab] User response submitted successfully');
        
        // Resume polling after a delay to give backend time to process
        setTimeout(() => {
          if (!pollIntervalRef.current && activeSessionId) {
            console.log('[StatusTab] Resuming polling after feedback submission');
            
            const resumedPollSessionState = async () => {
              try {
                const sessionState = await fetchSessionState(userId, sessionId);
                if (sessionState && sessionState.state) {
                  const workflowStatus = sessionState.state.workflow_status;
                  console.log('[StatusTab] Resumed polling - workflow status:', workflowStatus);
                  
                  if (workflowStatus === WORKFLOW_STATUS.ORDER_CONFIRMED) {
                    setStatusTitle('Order Confirmed! 🎉');
                    setStatusSubtitle('Your meal has been successfully ordered');
                    setIsActive(false);
                    
                    const message = sessionState.state.order_confirmation_message || 'Your meal order has been successfully placed!';
                    if (celebrationShownForSession !== sessionId) {
                      setCelebrationMessage(message);
                      setShowCelebration(true);
                      setCelebrationShownForSession(sessionId);
                      setTimeout(() => setShowCelebration(false), 10000);
                    }
                    
                    if (pollIntervalRef.current) {
                      clearInterval(pollIntervalRef.current);
                      pollIntervalRef.current = null;
                    }
                    setActiveSessionId(null);
                  } else if (workflowStatus === WORKFLOW_STATUS.ORDER_EXECUTION_STARTED) {
                    setStatusTitle('Placing Your Order');
                    setStatusSubtitle('Executing the order...');
                    setIsActive(true);
                  }
                }
              } catch (error) {
                console.error('[StatusTab] Error in resumed polling:', error);
              }
            };
            
            resumedPollSessionState();
            pollIntervalRef.current = setInterval(resumedPollSessionState, 3000);
          }
        }, 3000);
      })
      .catch((error) => {
        console.error('Error submitting response:', error);
        toast.error('Failed to submit response. Please try again.');
        setUserFeedbackReceived(false);
      });
  };

  const handleModalClose = () => {
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <StatusCard
        title={statusTitle}
        subtitle={statusSubtitle}
        isActive={isActive}
        sessionState={currentSessionState}
        workflowStatus={currentWorkflowStatus}
      />

      {/* Info Message */}
      {!currentSessionState && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="text-blue-400 mt-1" size={20} />
          <div className="text-sm text-blue-200">
            No activity yet. Navigate to the "My Meals" tab and click "Plan Now" on any meal to start the autonomous agent workflow.
          </div>
        </div>
      )}

      {/* Session History */}
      <SessionHistory
        sessions={sessionHistory}
        currentSessionId={activeSessionId}
        onChatClick={handleChatClick}
      />

      {/* Selection Modal */}
      <SelectionModal
        isOpen={showModal}
        onClose={handleModalClose}
        message={modalMessage}
        mealChoices={modalMealChoices}
        onSubmit={handleModalSubmit}
      />

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-linear-to-br from-green-600 to-green-700 border border-green-500 rounded-2xl max-w-lg mx-4 p-8 text-center shadow-2xl transform celebration-bounce">
            <div className="mb-4">
              <PartyPopper className="mx-auto text-white" size={64} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Order Confirmed! 🎉</h3>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-white text-lg leading-relaxed">{celebrationMessage}</p>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 bg-white text-green-700 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              👍 Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTab;
