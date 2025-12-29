
export enum AppState {
  WELCOME = 'WELCOME',
  ONBOARDING = 'ONBOARDING',
  GENERATING = 'GENERATING',
  HOME = 'HOME',
  ROADMAP = 'ROADMAP',
  TUTOR = 'TUTOR',
  GAMES = 'GAMES',
  PROFILE = 'PROFILE'
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface UserPreferences {
  nativeLanguage: string;
  targetLanguage: string;
  level: string;
  goals: string;
  interests: string;
  learningStyle: string;
}

export interface TeacherPersona {
  name: string;
  age: number;
  personality: string;
  teachingStyle: string;
  catchphrase: string;
  avatarSeed: number; 
}

export interface WeeklyGoal {
  week: number;
  theme: string;
  focus: string;
  activity: string;
  completed: boolean;
}

export interface Roadmap {
  weeks: WeeklyGoal[];
}

export interface GameContent {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  concept: string;
  category: string;
}

export interface UserProgress {
  lastSessionDate: string;
  lastTopic: string;
  xp: number;
  streak: number;
}

export interface User {
  id: string;
  name: string;
  preferences: UserPreferences;
  character: TeacherPersona;
  roadmap: Roadmap;
  progress: UserProgress;
  chatHistory: Message[];
  warningCount: number;
  isBanned: boolean;
}
