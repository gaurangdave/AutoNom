import { useState, useEffect } from 'react';
import { IdCard, Calendar, Clock, Sliders, AlertTriangle, MessageSquare, Save } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { useAutoNom } from '../../hooks/useAutoNom';
import { useToast } from '../../hooks/useToast';
import DaySelector from '../profile/DaySelector';
import MealSlotList from '../profile/MealSlotList';
import PreferenceInput from '../profile/PreferenceInput';
import AllergyGrid from '../profile/AllergyGrid';

const ProfileTab = () => {
  const { currentUser, currentUserId, upsertUser, selectUser } = useUser();
  const { saveUserToAPI } = useAutoNom();
  const toast = useToast();
  
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState([false, false, false, false, false, false, false]);
  const [meals, setMeals] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load current user data into form
  useEffect(() => {
    if (currentUser) {
      console.log('Loading current user data:', currentUser);
      setName(currentUser.name || '');
      setSelectedDays(currentUser.schedule || [false, false, false, false, false, false, false]);
      setMeals(currentUser.meals || []);
      setPreferences(currentUser.preferences || []);
      setAllergies(currentUser.allergies || []);
      setInstructions(currentUser.instructions || '');
    } else if (currentUserId && currentUserId !== 'create_new') {
      // User ID exists but no data loaded yet
      setName('');
      setSelectedDays([false, false, false, false, false, false, false]);
      setMeals([]);
      setPreferences([]);
      setAllergies([]);
      setInstructions('');
    } else {
      // Creating new user
      setName('');
      setSelectedDays([false, false, false, false, false, false, false]);
      setMeals([]);
      setPreferences([]);
      setAllergies([]);
      setInstructions('');
    }
  }, [currentUser, currentUserId]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Please enter a name');
      return;
    }

    if (meals.length === 0) {
      toast.warning('Please add at least one meal slot');
      return;
    }

    setIsSaving(true);

    try {
      const userData = {
        user_id: currentUserId,
        name: name.trim(),
        schedule: selectedDays,
        meals: meals,
        preferences: preferences,
        allergies: allergies,
        instructions: instructions.trim()
      };

      const savedUser = await saveUserToAPI(userData);
      
      console.log('User saved, updating context with:', savedUser);
      
      // Update local state - upsertUser will update both users array
      upsertUser(savedUser);
      
      // Always select the saved user to ensure proper sync
      // This will update both currentUserId and trigger the useEffect in UserContext
      selectUser(savedUser.user_id);
      
      console.log('User upserted and selected:', savedUser.user_id);

      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <IdCard className="text-primary-500 mr-3" size={20} />
          Personal Details
        </h2>
        <div>
          <label htmlFor="input-name" className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            First Name
          </label>
          <input
            type="text"
            id="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your first name"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-slate-600"
          />
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Calendar className="text-primary-500 mr-3" size={20} />
          Delivery Days
        </h2>
        <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
      </section>

      {/* Meal Slots */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Clock className="text-primary-500 mr-3" size={20} />
            Meal Schedule
          </h2>
        </div>
        <MealSlotList meals={meals} onChange={setMeals} />
      </section>

      {/* Preferences */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Sliders className="text-primary-500 mr-3" size={20} />
          Preferences
        </h2>
        <PreferenceInput preferences={preferences} onChange={setPreferences} />
      </section>

      {/* Allergies */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertTriangle className="text-red-500 mr-3" size={20} />
          Allergies
        </h2>
        <AllergyGrid allergies={allergies} onChange={setAllergies} />
      </section>

      {/* Instructions */}
      <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl shadow-black/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MessageSquare className="text-primary-500 mr-3" size={20} />
          Special Instructions
        </h2>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Anything else we should know? e.g., Gate code is 1234..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 transition-all placeholder-slate-600 resize-none"
        />
      </section>

      {/* Save Button */}
      <div className="sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/25 transform transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Profile Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
