
import React from 'react';
import { Home, Map, Gamepad2, MessageCircle } from 'lucide-react';
import { AppState } from '../types';

interface BottomNavProps {
  currentTab: AppState;
  onTabChange: (tab: AppState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: AppState.HOME, icon: Home, label: 'Today' },
    { id: AppState.ROADMAP, icon: Map, label: 'Roadmap' },
    { id: AppState.GAMES, icon: Gamepad2, label: 'Arcade' },
    { id: AppState.TUTOR, icon: MessageCircle, label: 'Mentor' },
  ];

  return (
    <nav className="bg-white border-t border-blue-50 px-8 py-5 flex justify-between items-center pb-12 sticky bottom-0 z-20 shadow-[0_-8px_30px_-10px_rgba(37,99,235,0.08)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center gap-2 transition-all active:scale-75 ${
              isActive ? 'text-blue-600' : 'text-blue-200 hover:text-blue-400'
            }`}
          >
            <div className={`p-2.5 rounded-[1.25rem] transition-all duration-300 ${isActive ? 'bg-blue-50 scale-110 shadow-inner' : ''}`}>
               <Icon size={28} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isActive ? 'opacity-100' : 'opacity-50'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
