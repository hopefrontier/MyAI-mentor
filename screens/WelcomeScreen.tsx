
import React, { useState, useEffect } from 'react';
import { ChevronRight, Globe, UserCheck, LogIn, UserPlus, ArrowLeft, Loader2, AlertTriangle, Ban } from 'lucide-react';
import { db } from '../services/storageService';
import { checkContentSafety } from '../services/geminiService';
import { User } from '../types';

interface WelcomeScreenProps {
  onStart: (name: string, native: string, target: string, level: string, interests: string) => void;
  onContinue: (user: User) => void;
  onBan: () => void;
}

type ViewState = 'SPLASH' | 'LOGIN' | 'CONFIRM' | 'SIGNUP';

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onContinue, onBan }) => {
  const [view, setView] = useState<ViewState>('SPLASH');
  const [loginName, setLoginName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [signupStep, setSignupStep] = useState(1);
  const [name, setName] = useState('');
  const [native, setNative] = useState('Arabic');
  const [target, setTarget] = useState('');
  const [level, setLevel] = useState('Beginner (A1)');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showYellowCard, setShowYellowCard] = useState(false);

  const languages = ['English', 'German', 'Spanish', 'French', 'Arabic', 'Italian'];
  const levels = ['Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Upper Int. (B2)'];
  const commonInterests = ['Travel', 'Business', 'Tech', 'History', 'Food', 'Reading', 'Sports'];

  useEffect(() => { if (view === 'LOGIN') setRecentUsers(db.getAllUsers().reverse().slice(0, 3)); }, [view]);

  const handleLoginSearch = () => {
    const user = db.findUserByNameAndId(loginName, loginId);
    if (user) {
      if (user.isBanned) { setError("Account suspended."); return; }
      setFoundUser(user);
      setView('CONFIRM');
    } else setError('User not found.');
  };

  const nextStep = async () => {
    setIsChecking(true);
    try {
      if (signupStep === 1 && name) {
        const check = await checkContentSafety(name);
        if (!check.isSafe) { setShowYellowCard(true); setIsChecking(false); return; }
        setSignupStep(2);
      } 
      else if (signupStep === 2 && target) setSignupStep(3);
      else if (signupStep === 3) {
        if (customInterest) {
          const check = await checkContentSafety(customInterest);
          if (!check.isSafe) { setShowYellowCard(true); setIsChecking(false); return; }
        }
        onStart(name, native, target, level, [...selectedInterests, customInterest].filter(Boolean).join(', '));
      }
    } catch (e) { console.error(e); } finally { setIsChecking(false); }
  };

  const renderSplash = () => (
    <div className="flex flex-col h-full p-12 justify-between bg-blue-700 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="mt-24 relative z-10 text-center">
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-10 mx-auto rotate-6 transform transition-all hover:rotate-0 hover:scale-110">
          <Globe size={56} className="text-blue-600" />
        </div>
        <h1 className="text-6xl font-black mb-4 tracking-tighter italic">Focus AI</h1>
        <p className="text-blue-100 text-xl font-bold opacity-90 max-w-[280px] mx-auto">Cognitive learning for peak performance.</p>
      </div>

      <div className="space-y-5 relative z-10 mb-12">
        <button onClick={() => setView('SIGNUP')} className="w-full bg-orange-500 text-white py-6 px-10 rounded-[2rem] font-black text-xl flex items-center justify-between shadow-2xl hover:bg-orange-400 transition-all active:scale-95">
          <div className="flex items-center gap-4"><UserPlus size={26} strokeWidth={3} /><span>New Profile</span></div>
          <ChevronRight size={24} />
        </button>
        <button onClick={() => setView('LOGIN')} className="w-full bg-blue-800/40 backdrop-blur-xl text-white border-2 border-blue-400/30 py-6 px-10 rounded-[2rem] font-black text-lg flex items-center justify-between hover:bg-blue-800/60 transition-all active:scale-95">
          <div className="flex items-center gap-4"><LogIn size={26} /><span>Sign In</span></div>
          <ChevronRight size={24} className="text-blue-300" />
        </button>
      </div>
    </div>
  );

  const renderSignup = () => (
    <div className="flex flex-col h-full bg-white p-10 relative">
       {showYellowCard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-900/90 backdrop-blur-xl p-8 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl">
             <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><AlertTriangle size={48} strokeWidth={3} /></div>
             <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Focus Check</h2>
             <p className="text-blue-700 font-bold mb-10 leading-relaxed">Your text didn't pass our safety protocol. Let's keep the study area professional!</p>
             <button onClick={() => setShowYellowCard(false)} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95">I'll Fix It</button>
          </div>
        </div>
      )}

      <div className="mb-12 flex items-center justify-between">
        <button onClick={() => signupStep === 1 ? setView('SPLASH') : setSignupStep(s => s - 1)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100"><ArrowLeft size={24} /></button>
        <div className="h-3 flex-1 mx-8 bg-blue-50 rounded-full overflow-hidden flex shadow-inner">
          <div className={`h-full bg-orange-500 transition-all duration-700 ${signupStep === 1 ? 'w-1/3' : signupStep === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {signupStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-10 duration-500">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight leading-none">Who's<br />Learning?</h2>
            <p className="text-blue-500 font-bold mb-12 text-lg">Enter your name to start tracking XP.</p>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" autoFocus className="w-full p-8 rounded-[2rem] bg-blue-50 border-4 border-blue-50 focus:bg-white focus:border-blue-600 transition-all outline-none text-3xl font-black placeholder-blue-100" />
          </div>
        )}

        {signupStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-10 duration-500 space-y-12">
             <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Your Path</h2>
             <div>
                <label className="block text-[10px] font-black text-blue-800 mb-5 ml-2 uppercase tracking-[0.3em]">Native Language</label>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map(l => (
                    <button key={l} onClick={() => setNative(l)} className={`p-5 rounded-3xl border-2 text-base font-black transition-all ${native === l ? 'border-blue-600 bg-blue-600 text-white shadow-2xl scale-105' : 'border-blue-50 bg-blue-50/30 text-blue-700 hover:border-blue-200'}`}>{l}</button>
                  ))}
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black text-blue-800 mb-5 ml-2 uppercase tracking-[0.3em]">Goal Language</label>
                <div className="grid grid-cols-2 gap-4">
                  {languages.filter(l => l !== native).map(l => (
                    <button key={l} onClick={() => setTarget(l)} className={`p-5 rounded-3xl border-2 text-base font-black transition-all ${target === l ? 'border-orange-400 bg-orange-500 text-white shadow-2xl scale-105' : 'border-blue-50 bg-blue-50/30 text-blue-700 hover:border-blue-200'}`}>{l}</button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {signupStep === 3 && (
          <div className="animate-in fade-in slide-in-from-right-10 duration-500 space-y-10">
             <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Interests</h2>
             <div className="flex flex-wrap gap-4">
                {commonInterests.map(interest => (
                  <button key={interest} onClick={() => setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])} className={`px-8 py-5 rounded-[2rem] border-2 text-sm font-black transition-all ${selectedInterests.includes(interest) ? 'bg-blue-600 border-blue-600 text-white shadow-2xl scale-110' : 'bg-blue-50/30 border-blue-50 text-blue-700 hover:border-blue-200'}`}>{interest}</button>
                ))}
             </div>
             <input type="text" value={customInterest} onChange={e => setCustomInterest(e.target.value)} placeholder="Other interests..." className="w-full p-8 rounded-[2rem] bg-blue-50 border-4 border-blue-50 focus:bg-white focus:border-blue-600 outline-none font-black text-2xl placeholder-blue-100" />
          </div>
        )}
      </div>

      <button onClick={nextStep} disabled={(signupStep === 1 && !name) || (signupStep === 2 && !target) || (signupStep === 3 && selectedInterests.length === 0 && !customInterest) || isChecking} className="bg-blue-600 text-white py-7 rounded-[2.5rem] font-black text-2xl disabled:opacity-30 shadow-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-5 mt-12 mb-10">
        {isChecking ? <><Loader2 className="animate-spin" size={28} /> Analyzing...</> : signupStep === 3 ? 'Start Studying' : 'Continue'}
      </button>
    </div>
  );

  switch (view) {
    case 'LOGIN': return <div className="p-10">Sign in logic...</div>;
    case 'SIGNUP': return renderSignup();
    default: return renderSplash();
  }
};
