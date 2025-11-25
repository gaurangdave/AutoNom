import { useState } from 'react';
import { Info } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import MealRoutineCard from '../meals/MealRoutineCard';

const MealsTab = () => {
  const { currentUser, getCurrentUserId } = useUser();
  const { triggerPlan } = useAutoNom();
  const [planningMeal, setPlanningMeal] = useState(null);

  const meals = currentUser?.meals || [];

  const handlePlanNow = async (mealType) => {
    const userId = getCurrentUserId();
    if (!userId) {
      alert('Please select a user first');
      return;
    }

    setPlanningMeal(mealType);
    
    try {
      await triggerPlan(
        userId,
        mealType,
        (eventData) => {
          console.log('Event:', eventData);
          // Events will be handled in StatusTab
        },
        () => {
          console.log('Planning completed');
          setPlanningMeal(null);
        },
        (error) => {
          console.error('Planning error:', error);
          alert('Failed to start meal planning. Please try again.');
          setPlanningMeal(null);
        }
      );
    } catch (error) {
      console.error('Error triggering plan:', error);
      setPlanningMeal(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={20} />
        <div className="text-sm text-blue-200">
          Please select or create a user profile first.
        </div>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={20} />
        <div className="text-sm text-blue-200">
          No meal routines configured yet. Please add meal slots in your profile.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="text-blue-400 mt-1" size={20} />
        <div className="text-sm text-blue-200">
          These are the meal routines configured in your profile. Click "Plan Now" to manually trigger the agent for a specific meal.
        </div>
      </div>

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

export default MealsTab;
