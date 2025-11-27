import { useState } from 'react';
import { Info } from 'lucide-react';
import PropTypes from 'prop-types';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import { createLogger } from '../../utils/logger';
import { INFO_MESSAGES, ERROR_MESSAGES, ICON_SIZES } from '../../utils/uiConstants';
import Card from '../common/Card';
import MealRoutineCard from '../meals/MealRoutineCard';

const logger = createLogger('MealsTab');

const MealsTab = ({ setActiveTab }) => {
  const { currentUser, getCurrentUserId, setActiveSessionId } = useUser();
  const { triggerPlan } = useAutoNom();
  const toast = useToast();
  const [planningMeal, setPlanningMeal] = useState(null);

  const meals = currentUser?.meals || [];

  const handlePlanNow = async (mealType) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.warning('Please select a user first');
      return;
    }

    setPlanningMeal(mealType);
    
    try {
      await triggerPlan(
        userId,
        mealType,
        (eventData) => {
          logger.log('Event:', eventData);
          // Store session ID in UserContext when received
          if (eventData.session_id) {
            logger.log('Setting active session ID:', eventData.session_id);
            setActiveSessionId(eventData.session_id);
            // Switch to Status tab to see the workflow progress
            logger.log('Switching to Status tab');
            setActiveTab('status');
          }
        },
        (responseData) => {
          logger.log('Planning completed:', responseData);
          // Also set session ID from completion response
          if (responseData?.session_id) {
            logger.log('Setting active session ID from completion:', responseData.session_id);
            setActiveSessionId(responseData.session_id);
            // Switch to Status tab to see the workflow progress
            logger.log('Switching to Status tab');
            setActiveTab('status');
          }
          setPlanningMeal(null);
        },
        (error) => {
          logger.error('Planning error:', error);
          toast.error(ERROR_MESSAGES.planningFailed);
          setPlanningMeal(null);
        }
      );
    } catch (error) {
      logger.error('Error triggering plan:', error);
      setPlanningMeal(null);
    }
  };

  if (!currentUser) {
    return (
      <Card variant="info" className="flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={ICON_SIZES.xl} />
        <div className="text-sm text-blue-200">
          {INFO_MESSAGES.noUser}
        </div>
      </Card>
    );
  }

  if (meals.length === 0) {
    return (
      <Card variant="info" className="flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={ICON_SIZES.xl} />
        <div className="text-sm text-blue-200">
          {INFO_MESSAGES.noMeals}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card variant="info" className="mb-6 flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={ICON_SIZES.xl} />
        <div className="text-sm text-blue-200">
          {INFO_MESSAGES.mealInstructions}
        </div>
      </Card>

      <div className="space-y-4">
        {meals.map((meal, index) => (
          <MealRoutineCard
            key={meal.id || index}
            meal={meal}
            onPlanClick={handlePlanNow}
          />
        ))}
      </div>

      {planningMeal && (
        <div className="fixed bottom-6 right-6 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <span>Planning {planningMeal}...</span>
        </div>
      )}
    </div>
  );
};

MealsTab.propTypes = {
  setActiveTab: PropTypes.func.isRequired,
};

export default MealsTab;
