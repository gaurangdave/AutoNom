import { Moon, Sun, ArrowRight } from 'lucide-react';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useUser } from '../../hooks/useUser';

const MealRoutineCard = ({ meal, onPlanClick }) => {
  const isDinner = meal.type.toLowerCase().includes('dinner') || meal.type.toLowerCase().includes('night');
  const Icon = isDinner ? Moon : Sun;

  return (
    <div className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 flex items-center justify-between group transition-all hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 group-hover:text-primary-400 group-hover:bg-slate-700/80 transition-colors">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-200">{meal.type}</h3>
          <div className="text-xs text-slate-500 font-mono mt-1">
            <span className="mr-1">🕐</span>
            {meal.start} - {meal.end}
          </div>
        </div>
      </div>
      <button
        onClick={() => onPlanClick(meal.type)}
        className="bg-slate-700 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span>Plan Now</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default MealRoutineCard;
