import { Plus } from 'lucide-react';
import MealSlotItem from './MealSlotItem';

const MealSlotList = ({ meals, onChange }) => {
  const addMealSlot = () => {
    const newMeal = {
      id: Date.now(),
      type: 'Lunch',
      start: '12:00',
      end: '13:00',
      customName: ''
    };
    onChange([...meals, newMeal]);
  };

  const removeMealSlot = (id) => {
    onChange(meals.filter(meal => meal.id !== id));
  };

  const updateMealSlot = (id, updatedMeal) => {
    onChange(meals.map(meal => meal.id === id ? updatedMeal : meal));
  };

  return (
    <div className="space-y-3">
      {meals.map(meal => (
        <MealSlotItem
          key={meal.id}
          meal={meal}
          onRemove={() => removeMealSlot(meal.id)}
          onChange={(updatedMeal) => updateMealSlot(meal.id, updatedMeal)}
        />
      ))}
      <button
        type="button"
        onClick={addMealSlot}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        <span>Add Meal Slot</span>
      </button>
    </div>
  );
};

export default MealSlotList;
