
import React, { useState, useCallback, useEffect } from 'react';
import { Ban } from 'lucide-react';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { OnboardingChat } from './screens/OnboardingChat';
import { ProfileGenScreen } from './screens/ProfileGenScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { TutorChat } from './screens/TutorChat';
import { GamesHub } from './screens/GamesHub';
import { GameScreen } from './screens/GameScreen';
import { AppState, UserPreferences, TeacherPersona, Roadmap, User } from './types';
import { db } from './services/storageService';

// Initial dummy prefs just for type safety before real data
const INITIAL_PREFS: UserPreferences = {
  nativeLanguage: 'English',
  targetLanguage: 'German',
  level: 'Beginner',
  goals: '',
  interests: '',
  learningStyle: ''
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>(INITIAL_PREFS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isDeviceBanned, setIsDeviceBanned] = useState(false);
  
  const [tempName, setTempName] = useState('');

  // Check device ban on mount
  useEffect(() => {
    if (db.isDeviceBanned()) {
      setIsDeviceBanned(true);
    }
  }, []);

  const handleDeviceBan = useCallback(() => {
    db.banDevice();
    setIsDeviceBanned(true);
  }, []);

  const handleWelcomeStart = (name: string, native: string, target: string, level: string, interests: string) => {
    setTempName(name);
    setUserPrefs(prev => ({ 
      ...prev, 
      nativeLanguage: native, 
      targetLanguage: target, 
      level,
      interests // Store initial interests
    }));
    setAppState(AppState.ONBOARDING);
  };

  const handleContinueUser = (user: User) => {
    if (user.isBanned) {
      // Just in case a banned user tries to log in via saved profile
      return; 
    }
    setCurrentUser(user);
    setUserPrefs(user.preferences);
    setAppState(AppState.HOME);
  };

  const handleOnboardingComplete = (summary: string) => {
    // We already have interests from the Welcome Screen.
    // The summary mainly contains Goals and Time Availability derived from the chat.
    setUserPrefs(prev => ({ 
      ...prev, 
      goals: summary.slice(0, 150), 
    }));
    setAppState(AppState.GENERATING);
  };

  const handleCreateUser = useCallback((newPersona: TeacherPersona, newRoadmap: Roadmap): User => {
    const newUser = db.createUser(tempName, userPrefs, newPersona, newRoadmap);
    setCurrentUser(newUser);
    return newUser;
  }, [tempName, userPrefs]);

  const handleGenerationComplete = (user: User) => {
    setAppState(AppState.HOME);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // Global Ban Screen (covers both User Account bans and Device bans)
  if (isDeviceBanned || currentUser?.isBanned) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
             <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ban size={40} />
             </div>
             <h2 className="text-3xl font-black text-gray-900 mb-2">BANNED</h2>
             <p className="text-gray-600 mb-6 leading-relaxed">
                Your access has been permanently suspended due to repeated violations of our community safety guidelines.
             </p>
             <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-left space-y-2 mb-8">
               <div className="flex justify-between">
                 <span className="text-gray-500">ID / Device</span>
                 <span className="font-mono font-bold">{currentUser ? currentUser.id : 'Guest Device'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500">Status</span>
                 <span className="text-red-600 font-bold">Suspended</span>
               </div>
             </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (appState) {
      case AppState.WELCOME:
        return <WelcomeScreen onStart={handleWelcomeStart} onContinue={handleContinueUser} onBan={handleDeviceBan} />;
      
      case AppState.ONBOARDING:
        return (
          <OnboardingChat 
            nativeLanguage={userPrefs.nativeLanguage} 
            name={tempName}
            interests={userPrefs.interests}
            onComplete={handleOnboardingComplete} 
            onBan={handleDeviceBan}
          />
        );
      
      case AppState.GENERATING:
        return (
          <ProfileGenScreen 
            prefs={userPrefs} 
            onCreateUser={handleCreateUser}
            onComplete={handleGenerationComplete} 
          />
        );
      
      case AppState.HOME:
        return currentUser ? <HomeScreen persona={currentUser.character} userPrefs={currentUser.preferences} onNavigate={setAppState} /> : null;
      
      case AppState.ROADMAP:
        return (currentUser) ? <RoadmapScreen roadmap={currentUser.roadmap} persona={currentUser.character} /> : null;
      
      case AppState.TUTOR:
        return (currentUser) ? <TutorChat user={currentUser} persona={currentUser.character} onUserUpdate={handleUserUpdate} /> : null;

      case AppState.GAMES:
        if (activeGame && currentUser) {
          return (
            <GameScreen 
              targetLang={currentUser.preferences.targetLanguage}
              nativeLang={currentUser.preferences.nativeLanguage}
              level={currentUser.preferences.level}
              theme="Common Phrases" 
              onExit={() => setActiveGame(null)} 
            />
          );
        }
        return <GamesHub onPlay={setActiveGame} />;
      
      default:
        return null;
    }
  };

  const showNav = [AppState.HOME, AppState.ROADMAP, AppState.GAMES, AppState.TUTOR].includes(appState) && !activeGame;

  return (
    <Layout>
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
      {showNav && <BottomNav currentTab={appState} onTabChange={setAppState} />}
    </Layout>
  );
};

export default App;
