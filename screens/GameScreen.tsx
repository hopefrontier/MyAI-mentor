
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, X, RefreshCw, Repeat, Target, Trophy, Mail, ThumbsUp, Volume2 } from 'lucide-react';
import { GameContent } from '../types';
import { generateVocabularyGame } from '../services/geminiService';

interface GameScreenProps {
  targetLang: string;
  nativeLang: string;
  level: string;
  theme: string;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ targetLang, nativeLang, level, theme, onExit }) => {
  const [gameData, setGameData] = useState<GameContent | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  
  const [currentConcept, setCurrentConcept] = useState<string | null>(null);
  const [reps, setReps] = useState(0);
  const [maxReps, setMaxReps] = useState(3);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const getLangTag = (lang: string) => {
    const map: Record<string, string> = { 'English': 'en-US', 'German': 'de-DE', 'Spanish': 'es-ES', 'French': 'fr-FR', 'Arabic': 'ar-SA', 'Italian': 'it-IT' };
    return map[lang] || 'en-US';
  };

  const cleanForTTS = (text: string) => text.replace(/[^\p{L}\p{N}\s'’]/gu, ' ').replace(/\s+/g, ' ').trim();

  const speak = (text: string, lang: string) => {
    synthRef.current.cancel();
    const cleanText = cleanForTTS(text);
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getLangTag(lang);
    utterance.rate = 0.95;
    synthRef.current.speak(utterance);
  };

  const fetchGame = async () => {
    setLoading(true);
    setAnswered(false);
    setSelected(null);
    try {
      const isNewConcept = !currentConcept || reps >= maxReps;
      const data = await generateVocabularyGame(targetLang, nativeLang, level, theme, isNewConcept ? undefined : currentConcept!);
      setGameData(data);
      if (isNewConcept) {
        setCurrentConcept(data.concept);
        setReps(1);
        setMaxReps(Math.floor(Math.random() * 3) + 3);
      } else {
        setReps(prev => prev + 1);
        setCurrentConcept(data.concept);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchGame(); return () => synthRef.current.cancel(); }, [targetLang]);

  const handleSelect = (option: string) => {
    if (answered || !gameData) return;
    const isCorrect = option === gameData.correctAnswer;
    setSelected(option);
    setAnswered(true);
    if (isCorrect) {
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      if (newStreak === 3) setTimeout(() => setShowFeedback(true), 800);
    } else setCorrectStreak(0);
    speak(gameData.correctAnswer, targetLang);
  };

  const WordPronouncer = ({ text, lang }: { text: string; lang: string }) => {
    const words = text.split(/(\s+)/);
    return (
      <>
        {words.map((part, i) => {
          if (/\s+/.test(part)) return part;
          const isSpeakable = /[\p{L}\p{N}'’]/u.test(part);
          return (
            <span 
              key={i} 
              onClick={(e) => { e.stopPropagation(); if (isSpeakable) speak(part, lang); }}
              className={`${isSpeakable ? 'hover:text-orange-500 cursor-pointer transition-all decoration-dotted underline underline-offset-4 decoration-blue-300 hover:decoration-orange-400' : 'text-gray-400'}`}
            >
              {part}
            </span>
          );
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-blue-600 text-white p-10 text-center">
        <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center animate-bounce mb-8 shadow-2xl">
          <RefreshCw className="animate-spin text-white" size={48} />
        </div>
        <h2 className="text-3xl font-black mb-4">Warming up your brain...</h2>
        <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px] opacity-70">Focus Blue Environment</p>
      </div>
    );
  }

  if (!gameData) return <div className="p-10 text-center font-black text-blue-900">Oops! Lost connection to the server.</div>;
  const isCorrect = selected === gameData.correctAnswer;

  return (
    <div className="flex flex-col h-full bg-blue-50/30 relative overflow-hidden">
      {showFeedback && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-900/95 backdrop-blur-xl p-6 animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl relative animate-in zoom-in-95">
             <button onClick={() => setShowFeedback(false)} className="absolute top-8 right-8 text-gray-400 hover:text-blue-600 transition-colors"><X size={28} /></button>
             <div className="inline-flex p-6 bg-orange-100 text-orange-500 rounded-[2.5rem] mb-8 shadow-inner ring-12 ring-orange-50">
                <Trophy size={56} fill="currentColor" />
             </div>
             <h2 className="text-4xl font-black text-gray-900 mb-4">On Fire!</h2>
             <p className="text-blue-700 font-bold mb-10">You've reached a 3-game streak. How are you feeling?</p>
             <div className="grid grid-cols-2 gap-4">
                <a href={`mailto:omarabdurrahim@gmail.com,hopelab2030@gmail.com?subject=Learning is fun!`} onClick={() => setShowFeedback(false)} className="flex flex-col items-center p-6 bg-blue-50 rounded-3xl gap-3 transition-all hover:scale-105 active:scale-95 border-2 border-blue-100 shadow-sm"><ThumbsUp className="text-blue-600" size={32} /><span className="font-black text-blue-900 text-xs uppercase tracking-widest">Love it</span></a>
                <a href={`mailto:omarabdurrahim@gmail.com,hopelab2030@gmail.com?subject=I have a suggestion`} onClick={() => setShowFeedback(false)} className="flex flex-col items-center p-6 bg-orange-50 rounded-3xl gap-3 transition-all hover:scale-105 active:scale-95 border-2 border-orange-100 shadow-sm"><Mail className="text-orange-600" size={32} /><span className="font-black text-orange-900 text-xs uppercase tracking-widest">Feedback</span></a>
             </div>
          </div>
        </div>
      )}

      <div className="p-4 flex items-center justify-between bg-white border-b border-blue-100 shadow-sm z-10">
        <button onClick={onExit} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 shadow-sm"><ArrowLeft size={24} /></button>
        {currentConcept && (
          <div className="flex flex-col items-center">
             <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em] mb-1">Retention Drill</span>
             <div className="flex items-center gap-2 text-sm font-black text-blue-700 bg-blue-50 px-5 py-2 rounded-2xl shadow-inner border border-blue-100">
                <Repeat size={14} className="animate-spin-slow text-orange-500" />
                <span>{reps} / {maxReps}</span>
             </div>
          </div>
        )}
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center overflow-y-auto no-scrollbar">
        {gameData.category && (
           <div className="mb-8 text-center">
             <span className="inline-flex items-center gap-2 px-6 py-3 bg-orange-100 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ring-8 ring-orange-50/50">
               <Target size={16} /> {gameData.category}
             </span>
           </div>
        )}

        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-blue-50 text-center mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-orange-400"></div>
          <button 
            onClick={() => speak(gameData.question, level.toLowerCase().includes('beginner') ? nativeLang : targetLang)}
            className="absolute top-6 right-6 text-blue-200 hover:text-blue-500 transition-all p-2 hover:scale-125 active:scale-90"
          >
            <Volume2 size={28} />
          </button>
          <p className="text-2xl text-gray-900 font-black leading-tight mb-4">
            <WordPronouncer text={gameData.question} lang={level.toLowerCase().includes('beginner') ? nativeLang : targetLang} />
          </p>
        </div>

        <div className="space-y-4">
          {gameData.options.map((option, idx) => {
            let btnClass = "bg-white border-blue-50 text-gray-800 hover:border-blue-200 hover:bg-blue-50 shadow-lg";
            if (answered) {
              if (option === gameData.correctAnswer) btnClass = "bg-blue-600 border-blue-700 text-white shadow-blue-200 shadow-2xl scale-[1.05] z-10 ring-8 ring-blue-500/10";
              else if (option === selected) btnClass = "bg-red-500 border-red-600 text-white shadow-xl";
              else btnClass = "opacity-30 bg-blue-50/50 grayscale scale-95 border-blue-100";
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                className={`w-full p-6 rounded-[2rem] border-2 font-black text-xl transition-all duration-300 ${btnClass} flex items-center justify-between group active:scale-95`}
              >
                <span>{option}</span>
                <Volume2 size={24} className={`transition-all ${answered && option === gameData.correctAnswer ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-40'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {answered && (
        <div className={`p-10 ${isCorrect ? 'bg-blue-700 text-white' : 'bg-red-500 text-white'} border-t border-black/10 animate-in slide-in-from-bottom-20 duration-500 z-20 rounded-t-[4rem] shadow-2xl`}>
          <div className="flex items-center gap-6 mb-8">
            <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center ${isCorrect ? 'bg-white text-blue-700' : 'bg-white text-red-600'} shadow-xl`}>
              {isCorrect ? <Check size={36} strokeWidth={4} /> : <X size={36} strokeWidth={4} />}
            </div>
            <div>
              <h3 className="font-black text-3xl leading-none mb-2">{isCorrect ? 'Brilliant!' : 'Almost!'}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{isCorrect ? 'Focus Reward • +10 XP' : 'Memory Reinforcement'}</p>
            </div>
          </div>
          
          <div className="bg-black/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 mb-8 flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Memory Note</p>
              <p className="text-lg font-bold italic leading-snug">"{gameData.explanation}"</p>
            </div>
            <button 
              onClick={() => speak(gameData.correctAnswer, targetLang)} 
              className="p-4 bg-white text-blue-600 rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-transform"
            >
              <Volume2 size={32} fill="currentColor" />
            </button>
          </div>

          <button onClick={fetchGame} className="w-full py-6 rounded-3xl font-black text-xl bg-orange-500 text-white shadow-2xl hover:bg-orange-400 active:scale-95 transition-all flex items-center justify-center gap-4">
            <span>Continue Mission</span>
            <ArrowLeft size={24} className="rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};
