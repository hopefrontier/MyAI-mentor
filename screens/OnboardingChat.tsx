
import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, Sparkles, AlertTriangle, Ban } from 'lucide-react';
import { sendOnboardingMessage, checkContentSafety } from '../services/geminiService';
import { db } from '../services/storageService';

interface OnboardingChatProps {
  nativeLanguage: string;
  name: string;
  interests: string;
  onComplete: (summary: string) => void;
  onBan: () => void;
}

interface ChatMsg {
  role: 'user' | 'model';
  text: string;
}

export const OnboardingChat: React.FC<OnboardingChatProps> = ({ nativeLanguage, name, interests, onComplete, onBan }) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Safety States
  const [showYellowCard, setShowYellowCard] = useState(false);
  const [showRedCard, setShowRedCard] = useState(false);

  useEffect(() => {
    if (!initialized.current) {
        // Dynamic initial message
        const initialText = interests 
            ? `Hi ${name}! I see you're interested in ${interests}. That helps me a lot! To finish your plan, I just need to know: What is your main goal for learning this language? (e.g. Work, Exam, Travel)`
            : `Hi ${name}! I'm your AI Coach. To build your perfect plan, I need to know a bit about you. What is your main goal for learning this language?`;
        
        setMessages([{ role: 'model', text: initialText }]);
        initialized.current = true;
    }
  }, [name, interests]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userInput = input;
    setInput('');
    setLoading(true);

    // --- SAFETY CHECK ---
    try {
      const check = await checkContentSafety(userInput);
      if (!check.isSafe) {
        setLoading(false);
        const warnings = db.incrementDeviceWarnings();
        if (warnings >= 2) {
          setShowRedCard(true);
        } else {
          setShowYellowCard(true);
        }
        return; // BLOCK message
      }
    } catch (e) {
      console.error("Safety check failed during onboarding", e);
    }
    // --------------------

    const newMsg: ChatMsg = { role: 'user', text: userInput };
    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);

    const userTurns = updatedMsgs.filter(m => m.role === 'user').length;

    if (userTurns >= 3) {
      const summary = updatedMsgs.map(m => `${m.role}: ${m.text}`).join('\n');
      setTimeout(() => onComplete(summary), 1500);
      return;
    }

    try {
      const history = updatedMsgs.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const response = await sendOnboardingMessage(history, userInput, interests);
      setMessages(prev => [...prev, { role: 'model', text: response || "I didn't catch that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
       {/* YELLOW CARD WARNING */}
       {showYellowCard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
             <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Warning</h2>
             <p className="text-gray-600 mb-6">
                Your message contained prohibited content. Please rephrase to continue building your profile.
             </p>
             <p className="text-xs font-bold text-red-500 mb-6 uppercase tracking-wider">
               One more violation will result in an immediate ban.
             </p>
             <button 
               onClick={() => setShowYellowCard(false)}
               className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold"
             >
               I Understand
             </button>
          </div>
        </div>
      )}

      {/* RED CARD BAN */}
      {showRedCard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-md p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Suspended</h2>
             <p className="text-gray-600 mb-6">
                Repeated violations of safety guidelines have resulted in a suspension.
             </p>
             <button 
               onClick={onBan}
               className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
             >
               Close App
             </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border-b border-gray-100 shadow-sm z-10 text-center">
        <h2 className="font-bold text-gray-900">Discovery Chat</h2>
        <p className="text-xs text-indigo-500 font-medium tracking-wide uppercase mt-1">Building your profile</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {messages.map((msg, i) => {
           const isUser = msg.role === 'user';
           return (
            <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-xs font-bold
                  ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-500 text-white'}`}>
                  {isUser ? <UserIcon size={14} /> : <Sparkles size={14} />}
                </div>

                <div className={`px-5 py-3.5 shadow-sm text-[15px] leading-relaxed
                  ${isUser 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none font-medium' 
                    : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-none font-semibold shadow-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </div>
           );
        })}
        {loading && (
           <div className="flex w-full justify-start">
             <div className="flex max-w-[85%] flex-row items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                   <Sparkles size={14} />
                </div>
                <div className="bg-white px-4 py-3 border border-gray-100 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center h-11">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-10">
        <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your answer..."
            className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-2 text-gray-800 placeholder-gray-400"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`p-3 rounded-full transition-all duration-200 shadow-sm ${
              !input.trim() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
