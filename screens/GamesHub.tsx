
import React from 'react';
import { Gamepad2, Headphones, MessageCircle, BookOpen } from 'lucide-react';
import { Header } from '../components/Layout';

interface GamesHubProps {
  onPlay: (gameType: string) => void;
}

export const GamesHub: React.FC<GamesHubProps> = ({ onPlay }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <Header title="Arcade" subtitle="Learn through play" />
      
      <div className="p-6 grid gap-4">
        <GameCard 
          icon={<Gamepad2 size={32} className="text-white" />}
          color="bg-purple-500"
          title="Vocab Blast"
          subtitle="Quick-fire words"
          onClick={() => onPlay('vocab')}
        />
        <GameCard 
          icon={<MessageCircle size={32} className="text-white" />}
          color="bg-pink-500"
          title="Speak Up"
          subtitle="Pronunciation"
          onClick={() => {}} // Not implemented in this demo
          locked
        />
        <GameCard 
          icon={<Headphones size={32} className="text-white" />}
          color="bg-sky-500"
          title="Audio Match"
          subtitle="Listening skills"
          onClick={() => {}} // Not implemented in this demo
          locked
        />
        <GameCard 
          icon={<BookOpen size={32} className="text-white" />}
          color="bg-orange-500"
          title="Story Time"
          subtitle="Reading comprehension"
          onClick={() => {}} // Not implemented in this demo
          locked
        />
      </div>
    </div>
  );
};

const GameCard = ({ icon, color, title, subtitle, onClick, locked }: any) => (
  <button 
    onClick={onClick}
    disabled={locked}
    className={`relative text-left rounded-2xl p-6 shadow-sm overflow-hidden transition-transform active:scale-95 ${locked ? 'opacity-60 grayscale cursor-not-allowed bg-gray-100' : 'bg-white hover:shadow-md'}`}
  >
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-inner ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xl text-gray-800">{title}</h3>
        <p className="text-gray-500">{subtitle}</p>
        {locked && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">Coming Soon</span>}
      </div>
    </div>
  </button>
);
