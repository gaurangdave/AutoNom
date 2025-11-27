import { useContext } from 'react';
import { Info, PartyPopper } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import { SessionContext } from '../../context/SessionContext';
import { useStatusStore } from '../../stores/statusStore';
import { getMealChoiceVerificationMessage, getMealChoices } from '../../utils/sessionAccessors';
import StatusCard from '../status/StatusCard';
import SelectionModal from '../status/SelectionModal';
import SessionHistory from '../status/SessionHistory';
import OrderConfirmationCard from '../status/OrderConfirmationCard';

const StatusTab = () => {
  const { getCurrentUserId, activeSessionId } = useUser();
  const toast = useToast();
  const sessionContext = useContext(SessionContext);
  const { submitUserResponse } = useAutoNom();

  // Read all state from Zustand store (no polling logic here)
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
    currentSessionState,
    currentWorkflowStatus,
    setModalMessage,
    setModalMealChoices,
    setShowModal,
    setShowCelebration,
    setSelectedSessionForChat,
    closeModal,
    markFeedbackReceived,
  } = useStatusStore();

  const handleChatClick = (session) => {
    const message = getMealChoiceVerificationMessage(session);
    const mealChoices = getMealChoices(session);
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
        
        // Resume polling via SessionProvider
        if (sessionContext?.resumePollingAfterFeedback) {
          sessionContext.resumePollingAfterFeedback(sessionId);
        }
      })
      .catch((error) => {
        console.error('Error submitting response:', error);
        toast.error('Failed to submit response. Please try again.');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-linear-to-br from-green-600 to-green-700 border border-green-500 rounded-2xl max-w-2xl w-full mx-4 p-8 shadow-2xl transform celebration-bounce max-h-[90vh] overflow-y-auto">
            <div className="mb-6 text-center">
              <PartyPopper className="mx-auto text-white mb-3" size={64} />
              <h3 className="text-3xl font-bold text-white mb-2">Order Confirmed! 🎉</h3>
              <p className="text-green-100 text-sm">Your order has been successfully placed</p>
            </div>
            
            <OrderConfirmationCard orderData={celebrationMessage} />
            
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 w-full bg-white text-green-700 font-bold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
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
