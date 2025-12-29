
import React from 'react';
import { Play, Check, Flame, Trophy } from 'lucide-react';
import { TeacherPersona, UserPreferences, AppState } from '../types';
import { Header } from '../components/Layout';

interface HomeScreenProps {
  persona: TeacherPersona;
  userPrefs: UserPreferences;
  onNavigate: (tab: AppState) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ persona, userPrefs, onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-blue-50/40 overflow-y-auto pb-4 no-scrollbar">
      <Header title="Daily Progress" subtitle={`Week 1 • Learning ${userPrefs.targetLanguage}`} />

      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl font-black shadow-inner">
                {persona.name[0]}
              </div>
              <div>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Personal Mentor</p>
                <h3 className="font-black text-2xl">{persona.name}</h3>
              </div>
            </div>
            <p className="text-xl italic font-bold mb-8 leading-tight text-blue-50 opacity-90">"{persona.catchphrase}"</p>
            <button 
              onClick={() => onNavigate(AppState.TUTOR)}
              className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-orange-400 hover:scale-105 transition-all active:scale-95 ring-4 ring-orange-500/20"
            >
              Start Chatting
            </button>
          </div>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-400/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="px-6 grid grid-cols-2 gap-4 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-50 flex items-center gap-4 transition-transform hover:scale-105">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <Flame size={28} fill="currentColor" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">1</p>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mt-1">Day Streak</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-50 flex items-center gap-4 transition-transform hover:scale-105">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
            <Trophy size={28} fill="currentColor" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 leading-none">0</p>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mt-1">Total XP</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
          Missions
          <div className="flex-1 h-[2px] bg-blue-100"></div>
        </h3>
        <div className="space-y-4 pb-10">
          <TaskCard 
            title="Focus Drill" 
            desc="5 min • Vocabulary" 
            completed={true} 
            icon={<Check size={20} strokeWidth={4} />}
          />
          <TaskCard 
            title="Arcade Practice" 
            desc="10 min • Fun Quiz" 
            onClick={() => onNavigate(AppState.GAMES)}
            cta="Play"
          />
          <TaskCard 
            title="Mentor Talk" 
            desc="15 min • Context" 
            onClick={() => onNavigate(AppState.TUTOR)}
            cta="Talk"
          />
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ title, desc, completed, onClick, cta, icon }: any) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-[1.75rem] border-2 flex items-center justify-between transition-all ${
      completed 
        ? 'bg-blue-50/50 border-blue-100 opacity-80' 
        : 'bg-white border-blue-50 hover:border-blue-200 hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
    }`}
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
        completed ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-blue-50 text-blue-600 shadow-inner'
      }`}>
        {completed ? icon : <Play size={20} fill="currentColor" />}
      </div>
      <div>
        <h4 className={`font-black text-lg ${completed ? 'text-blue-900' : 'text-gray-900'}`}>{title}</h4>
        <p className={`text-[11px] font-black uppercase tracking-tight ${completed ? 'text-blue-400' : 'text-blue-500/60'}`}>{desc}</p>
      </div>
    </div>
    {cta && !completed && (
      <span className="text-[10px] font-black bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl shadow-blue-100 hover:scale-110 active:scale-95 transition-all">
        {cta}
      </span>
    )}
  </div>
);
