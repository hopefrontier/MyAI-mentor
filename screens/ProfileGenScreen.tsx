import React, { useEffect, useState, useRef } from 'react';
import { Loader2, Sparkles, CheckCircle2, UserCheck, Copy } from 'lucide-react';
import { generateTeacherPersona, generateRoadmap } from '../services/geminiService';
import { UserPreferences, TeacherPersona, Roadmap, User } from '../types';

interface ProfileGenScreenProps {
  prefs: UserPreferences;
  onCreateUser: (persona: TeacherPersona, roadmap: Roadmap) => User;
  onComplete: (user: User) => void;
}

export const ProfileGenScreen: React.FC<ProfileGenScreenProps> = ({ prefs, onCreateUser, onComplete }) => {
  const [status, setStatus] = useState(0); // 0: Persona, 1: Roadmap, 2: Done
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Guard to ensure we only run the generation logic once per mount
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;

    let mounted = true;

    const generate = async () => {
      try {
        // Step 1: Persona
        const persona = await generateTeacherPersona(prefs);
        if(!mounted) return;
        setStatus(1);

        // Step 2: Roadmap
        const roadmap = await generateRoadmap(prefs);
        if(!mounted) return;
        setStatus(2);

        // Create User immediately
        const user = onCreateUser(persona, roadmap);
        if(!mounted) return;
        setCreatedUser(user);

      } catch (error) {
        console.error("Generation failed", error);
      }
    };

    generate();

    return () => { mounted = false; };
  }, [prefs, onCreateUser]);

  const copyId = () => {
    if (createdUser) {
      navigator.clipboard.writeText(createdUser.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { title: "Finding your perfect teacher...", done: status > 0 },
    { title: "Crafting your 4-week roadmap...", done: status > 1 },
    { title: "Personalizing games...", done: status > 1 }
  ];

  if (createdUser) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 bg-white text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="text-emerald-600" size={40} />
        </div>

        <h2 className="text-3xl font-bold mb-2 text-gray-900">You're all set!</h2>
        <p className="text-gray-500 mb-8">Your personalized plan is ready.</p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 w-full max-w-sm mb-8 relative">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Your Login Credentials</p>
          
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-sm text-gray-500 block mb-1">Name</span>
              <span className="text-lg font-bold text-gray-900">{createdUser.name}</span>
            </div>
            
            <div className="bg-white p-3 rounded-xl border border-indigo-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block text-left">User ID</span>
                <span className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">{createdUser.id}</span>
              </div>
              <button 
                onClick={copyId}
                className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                title="Copy ID"
              >
                {copied ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Copy size={24} />}
              </button>
            </div>
          </div>
          
          <p className="text-xs text-indigo-500 mt-4 font-medium">
            {copied ? "ID copied to clipboard!" : "Please save this ID to log in later."}
          </p>
        </div>

        <button 
          onClick={() => onComplete(createdUser)}
          className="w-full max-w-sm bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition-all"
        >
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 bg-white text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8 relative">
        <Sparkles className="text-indigo-600 animate-pulse" size={40} />
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-[spin_3s_linear_infinite]"></div>
      </div>

      <h2 className="text-2xl font-bold mb-2">Building Your AI Coach</h2>
      <p className="text-gray-500 mb-8">This takes just a moment...</p>

      <div className="w-full max-w-xs space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3 transition-all duration-500">
            {step.done ? (
               <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={24} />
            ) : status === idx ? (
               <Loader2 className="text-indigo-600 animate-spin flex-shrink-0" size={24} />
            ) : (
               <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex-shrink-0" />
            )}
            <span className={`text-left font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};