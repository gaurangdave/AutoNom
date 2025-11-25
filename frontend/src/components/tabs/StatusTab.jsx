import { useState, useEffect, useRef } from 'react';
import { Info, PartyPopper } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import StatusCard from '../status/StatusCard';
import SelectionModal from '../status/SelectionModal';

const StatusTab = () => {
  const { getCurrentUserId, activeSessionId } = useUser();
  const toast = useToast();
  const { 
    eventLog, 
    fetchSessionState,
    submitUserResponse
  } = useAutoNom();

  const pollIntervalRef = useRef(null);
  const [statusTitle, setStatusTitle] = useState('No Active Session');
  const [statusSubtitle, setStatusSubtitle] = useState('Start a meal plan from the Meals tab');
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Monitor event log for state changes
  useEffect(() => {
    if (eventLog.length > 0) {
      const latestEvent = eventLog[eventLog.length - 1];
      
      // Update status based on workflow status
      if (latestEvent.workflow_status === 'AWAITING_USER_APPROVAL' && latestEvent.text) {
        setStatusTitle('Awaiting Your Approval');
        setStatusSubtitle('The agent needs your input to continue');
        setIsActive(true);
        
        // Show modal for approval
        setModalMessage(latestEvent.text);
        setShowModal(true);
      } else if (latestEvent.workflow_status === 'ORDER_CONFIRMED') {
        setStatusTitle('Order Confirmed! 🎉');
        setStatusSubtitle('Your meal has been successfully ordered');
        setIsActive(false);
        
        // Show celebration
        if (latestEvent.text) {
          setCelebrationMessage(latestEvent.text);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 10000);
        }
      } else if (latestEvent.workflow_status === 'MEAL_PLANNING_STARTED') {
        setStatusTitle('Planning Your Meal');
        setStatusSubtitle('Finding the best options for you...');
        setIsActive(true);
      } else if (latestEvent.workflow_status === 'ORDER_EXECUTION_STARTED') {
        setStatusTitle('Placing Your Order');
        setStatusSubtitle('Executing the order...');
        setIsActive(true);
      } else if (latestEvent.workflow_status === 'COMPLETED') {
        setStatusTitle('Session Completed');
        setStatusSubtitle('All done!');
        setIsActive(false);
      }
    } else {
      setStatusTitle('No Active Session');
      setStatusSubtitle('Start a meal plan from the Meals tab');
      setIsActive(false);
    }
  }, [eventLog]);

  // Poll for session state when activeSessionId changes
  useEffect(() => {
    const userId = getCurrentUserId();
    
    console.log('[StatusTab] Session polling effect triggered:', { activeSessionId, userId });
    
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    
    // If no valid session or no user, stop polling
    if (!activeSessionId || !userId) {
      console.log('[StatusTab] No session or user, stopping polling');
      return;
    }

    console.log('[StatusTab] Active session ID detected:', activeSessionId);

    // Function to poll session state
    const pollSessionState = async () => {
      try {
        console.log('[StatusTab] Polling session state for:', { userId, activeSessionId });
        const sessionState = await fetchSessionState(userId, activeSessionId);
        console.log('[StatusTab] Session state response:', sessionState);
        
        if (sessionState && sessionState.state) {
          const workflowStatus = sessionState.state.workflow_status;
          console.log('[StatusTab] Workflow status:', workflowStatus);
          
          // Update status based on workflow status from session state
          if (workflowStatus === 'AWAITING_USER_APPROVAL') {
            setStatusTitle('Awaiting Your Approval');
            setStatusSubtitle('The agent needs your input to continue');
            setIsActive(true);
            
            // Show modal with meal choice verification message
            const message = sessionState.state.meal_choice_verification_message;
            if (message && !showModal) {
              console.log('[StatusTab] Showing approval modal with message');
              setModalMessage(message);
              setShowModal(true);
            }
          } else if (workflowStatus === 'ORDER_CONFIRMED') {
            setStatusTitle('Order Confirmed! 🎉');
            setStatusSubtitle('Your meal has been successfully ordered');
            setIsActive(false);
            
            // Stop polling once order is confirmed
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (workflowStatus === 'MEAL_PLANNING_STARTED') {
            setStatusTitle('Planning Your Meal');
            setStatusSubtitle('Finding the best options for you...');
            setIsActive(true);
          } else if (workflowStatus === 'ORDER_EXECUTION_STARTED') {
            setStatusTitle('Placing Your Order');
            setStatusSubtitle('Executing the order...');
            setIsActive(true);
          } else if (workflowStatus === 'STARTED') {
            setStatusTitle('Workflow Started');
            setStatusSubtitle('Processing your request...');
            setIsActive(true);
          }
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
      console.log('[StatusTab] Cleaning up polling interval');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeSessionId, getCurrentUserId, fetchSessionState, showModal]);

  const handleModalSubmit = async (response) => {
    const userId = getCurrentUserId();
    if (!userId || !activeSessionId) {
      toast.error('Session information not available');
      return;
    }

    try {
      await submitUserResponse(userId, activeSessionId, response);
      setShowModal(false);
      
      // Update status
      setStatusTitle('Processing Your Response');
      setStatusSubtitle('The agent is continuing with your selection...');
      setIsActive(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  return (
    <div>
      {/* Status Card */}
      <StatusCard
        title={statusTitle}
        subtitle={statusSubtitle}
        isActive={isActive}
        events={eventLog}
      />

      {/* Info Message */}
      {eventLog.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="text-blue-400 mt-1" size={20} />
          <div className="text-sm text-blue-200">
            No activity yet. Navigate to the "My Meals" tab and click "Plan Now" on any meal to start the autonomous agent workflow.
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <SelectionModal
        isOpen={showModal}
        onClose={handleModalClose}
        message={modalMessage}
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
