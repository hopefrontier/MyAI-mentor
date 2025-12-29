import React from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import { Roadmap, TeacherPersona } from '../types';
import { Header } from '../components/Layout';

interface RoadmapScreenProps {
  roadmap: Roadmap;
  persona: TeacherPersona;
}

export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({ roadmap, persona }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-4">
      <Header title="Your Journey" subtitle="4-Week Roadmap" />
      
      <div className="p-6 relative">
        {/* Vertical Line */}
        <div className="absolute left-10 top-8 bottom-0 w-0.5 bg-gray-200 z-0" />

        <div className="space-y-8 relative z-10">
          {roadmap.weeks.map((week, idx) => {
            const isCurrent = idx === 0;
            const isLocked = idx > 0;

            return (
              <div key={week.week} className="flex gap-4">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-4 ${
                  isCurrent 
                    ? 'bg-indigo-600 border-indigo-100 text-white shadow-md' 
                    : isLocked 
                      ? 'bg-gray-100 border-gray-50 text-gray-400' 
                      : 'bg-emerald-500 border-emerald-100 text-white'
                }`}>
                  {isCurrent ? <Circle size={12} fill="currentColor" /> : isLocked ? <Lock size={14} /> : <CheckCircle size={16} />}
                </div>

                {/* Content */}
                <div className={`flex-1 p-5 rounded-2xl border ${
                  isCurrent 
                    ? 'bg-white border-indigo-100 shadow-md' 
                    : 'bg-white/60 border-gray-100'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent ? 'text-indigo-600' : 'text-gray-400'
                    }`}>Week {week.week}</span>
                    {isCurrent && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Current</span>}
                  </div>
                  
                  <h3 className={`font-bold text-lg mb-1 ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                    {week.theme}
                  </h3>
                  <p className={`text-sm mb-3 ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    Focus: {week.focus}
                  </p>

                  <div className={`text-sm p-3 rounded-lg ${
                    isCurrent ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <strong>Task:</strong> {week.activity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-6 text-center text-gray-400 text-sm">
        <p>Roadmap adapts weekly based on your progress.</p>
      </div>
    </div>
  );
};