
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertTriangle, Ban, Mail, Volume2, Pause, VolumeX, Play } from 'lucide-react';
import { TeacherPersona, Message, User } from '../types';
import { chatWithTutor, checkContentSafety } from '../services/geminiService';
import { db } from '../services/storageService';
import { Header } from '../components/Layout';

interface TutorChatProps {
  user: User;
  persona: TeacherPersona;
  onUserUpdate: (updatedUser: User) => void;
}

export const TutorChat: React.FC<TutorChatProps> = ({ user, persona, onUserUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  const getLangTag = (lang: string) => {
    const map: Record<string, string> = {
      'English': 'en-US',
      'German': 'de-DE',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'Arabic': 'ar-SA',
      'Italian': 'it-IT'
    };
    return map[lang] || 'en-US';
  };

  /**
   * Cleans text for TTS. 
   * Preserves apostrophes so words like "d'accord" or "m'appelle" are read correctly.
   */
  const cleanForTTS = (text: string) => {
    return text.replace(/[^\p{L}\p{N}\s'’]/gu, ' ').replace(/\s+/g, ' ').trim();
  };

  const speak = (text: string, lang: string, index?: number) => {
    if (index !== undefined && isSpeaking === index) {
      if (isPaused) {
        synthRef.current.resume();
        setIsPaused(false);
      } else {
        synthRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    synthRef.current.cancel();
    const cleanText = cleanForTTS(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLangTag(lang);
    utterance.rate = 0.95; 
    
    if (index !== undefined) {
      utterance.onstart = () => {
        setIsSpeaking(index);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(null);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(null);
        setIsPaused(false);
      };
      synthRef.current.speak(utterance);
    } else {
      synthRef.current.speak(utterance);
    }
  };

  useEffect(() => {
    if (user.chatHistory && user.chatHistory.length > 0) {
      setMessages(user.chatHistory);
    } else {
      setMessages([{
        role: 'model',
        text: `Hello ${user.name}! I am ${persona.name}. Ready to dive into some ${user.preferences.targetLanguage}?`
      }]);
    }
    return () => synthRef.current.cancel();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const textToSend = input;
    setInput('');

    try {
      const safetyCheck = await checkContentSafety(textToSend);
      if (!safetyCheck.isSafe) {
        const newWarningCount = (user.warningCount || 0) + 1;
        const resultUser = db.updateUserSafety(user.id, newWarningCount >= 2, newWarningCount);
        if (resultUser) onUserUpdate(resultUser);
        setLoading(false);
        return;
      }
    } catch (e) { console.error(e); }

    const userMsg: Message = { role: 'user', text: textToSend };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    try {
      const response = await chatWithTutor(
        newHistory, 
        textToSend, 
        persona, 
        user.preferences.targetLanguage,
        user.preferences.nativeLanguage,
        user.preferences.level,
        user.progress.lastTopic 
      );
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a little trouble connecting. Check your signal!" }]);
    } finally {
      setLoading(false);
    }
  };

  const WordWrapper = ({ text, lang }: { text: string; lang: string }) => {
    const parts = text.split(/(\s+)/);
    return (
      <>
        {parts.map((part, i) => {
          if (/\s+/.test(part)) return part;
          const isSpeakable = /[\p{L}\p{N}'’]/u.test(part);
          return (
            <span 
              key={i} 
              onClick={(e) => {
                e.stopPropagation();
                if (isSpeakable) speak(part, lang);
              }}
              className={`${isSpeakable ? 'hover:text-blue-600 cursor-pointer underline decoration-dotted decoration-blue-200 hover:decoration-orange-400 underline-offset-4 transition-all' : 'text-gray-400'}`}
            >
              {part}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-blue-50/50 relative">
      <Header title="Study Session" subtitle={`Mentored by ${persona.name}`} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-blue-50/20 no-scrollbar">
        {messages.map((msg, i) => {
           const isUser = msg.role === 'user';
           const cleanTextForDisplay = msg.text.replace('[FEEDBACK_ACTION]', '');
           
           return (
            <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md text-sm font-black border-2
                  ${isUser ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-white/20'}`}>
                  {isUser ? user.name[0] : persona.name[0]}
                </div>

                <div className={`px-5 py-4 shadow-lg text-[16px] transition-all relative group
                  ${isUser 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-none font-medium' 
                    : 'bg-white text-gray-800 border border-blue-50 rounded-2xl rounded-bl-none font-semibold shadow-blue-900/5'
                  }`}>
                  {!isUser && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); speak(cleanTextForDisplay, user.preferences.targetLanguage, i); }}
                      className={`absolute -top-5 -right-5 p-3 rounded-full border shadow-xl transition-all z-20 ${
                        isSpeaking === i 
                        ? 'bg-orange-500 text-white border-orange-600 scale-110' 
                        : 'bg-white text-blue-600 border-blue-100 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
                      }`}
                    >
                      {isSpeaking === i ? (isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />) : <Volume2 size={16} />}
                    </button>
                  )}

                  <div className="leading-relaxed">
                    <WordWrapper text={cleanTextForDisplay} lang={isUser ? user.preferences.nativeLanguage : user.preferences.targetLanguage} />
                  </div>

                  {msg.text.includes('[FEEDBACK_ACTION]') && (
                    <a 
                      href={`mailto:omarabdurrahim@gmail.com,hopelab2030@gmail.com?subject=App Feedback`}
                      className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 p-2.5 rounded-xl text-sm font-bold transition-colors mt-3 w-fit shadow-sm"
                    >
                      <Mail size={16} /> Give Feedback
                    </a>
                  )}
                </div>
              </div>
            </div>
           );
        })}
        {loading && (
           <div className="flex w-full justify-start">
             <div className="flex max-w-[85%] flex-row items-end gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black border-2 border-white/20">
                  {persona.name[0]}
                </div>
                <div className="bg-white px-5 py-4 border border-blue-50 rounded-2xl rounded-bl-none shadow-md flex gap-2 items-center h-12">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-blue-100 shadow-[0_-4px_25px_-10px_rgba(37,99,235,0.1)] z-10">
        <div className="flex gap-3 items-end bg-blue-50/50 p-2.5 rounded-3xl border border-blue-100 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your response..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-gray-800 placeholder-blue-300 pl-4 font-semibold"
            rows={1}
            style={{ minHeight: '48px' }}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className={`p-3.5 rounded-2xl transition-all shadow-lg ${
              !input.trim() 
                ? 'bg-blue-100 text-blue-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-blue-200'
            }`}
          >
            {loading ? <Sparkles size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
