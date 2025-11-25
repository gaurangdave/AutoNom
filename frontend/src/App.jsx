import { useState } from 'react';
import { UserProvider } from './context/UserContext';
import Header from './components/Header';
import ProfileTab from './components/tabs/ProfileTab';
import MealsTab from './components/tabs/MealsTab';
import StatusTab from './components/tabs/StatusTab';
import { UserCog, Utensils, ListChecks } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCog },
    { id: 'meals', label: 'My Meals', icon: Utensils },
    { id: 'status', label: 'Status', icon: ListChecks },
  ];

  return (
    <UserProvider>
      <div className="bg-slate-900 text-slate-200 font-sans min-h-screen selection:bg-primary-500 selection:text-white">
        <Header />
        
        <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8 border border-slate-700/50 backdrop-blur-sm">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="inline mr-2" size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="fade-in">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'meals' && <MealsTab />}
            {activeTab === 'status' && <StatusTab />}
          </div>
        </main>
      </div>
    </UserProvider>
  );
}

export default App;

