
import { User, UserPreferences, TeacherPersona, Roadmap, Message } from '../types';

const STORAGE_KEY = 'MYAI_USERS_DB_V1';
const DEVICE_BAN_KEY = 'MYAI_DEVICE_BANNED';
const DEVICE_WARNINGS_KEY = 'MYAI_DEVICE_WARNINGS';

export class MockDatabase {
  usersList: User[];

  constructor() {
    this.usersList = this.load();
  }

  private load(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load users", e);
      return [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.usersList));
    } catch (e) {
      console.error("Failed to save users", e);
    }
  }

  /**
   * Generates a unique ID randomly between 001 and 100,000
   */
  private generateId(): string {
    while (true) {
      // Generate random number between 1 and 100,000
      const num = Math.floor(Math.random() * 100000) + 1;
      
      // Convert to string and pad with zeros if less than 3 digits (e.g., 1 -> "001")
      const idStr = String(num).padStart(3, '0');
      
      // Check if this ID already exists
      const exists = this.usersList.some(u => u.id === idStr);
      if (!exists) {
        return idStr;
      }
    }
  }

  /**
   * Creates a new user, assigns unique ID, and appends to usersList
   */
  createUser(name: string, prefs: UserPreferences, persona: TeacherPersona, roadmap: Roadmap): User {
    const id = this.generateId();
    
    const newUser: User = {
      id,
      name: name || `Student ${id}`,
      preferences: prefs,
      character: persona,
      roadmap: roadmap,
      progress: {
        lastSessionDate: new Date().toISOString(),
        lastTopic: 'Introduction',
        xp: 0,
        streak: 1
      },
      chatHistory: [],
      warningCount: 0,
      isBanned: false
    };

    this.usersList.push(newUser);
    this.save();
    console.log(`User created: ${newUser.name} (ID: ${newUser.id})`);
    return newUser;
  }

  /**
   * Updates user progress and chat history
   */
  updateUserProgress(userId: string, updates: Partial<User['progress']>, chatHistory?: Message[]) {
    const userIndex = this.usersList.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.usersList[userIndex].progress = {
        ...this.usersList[userIndex].progress,
        ...updates,
        lastSessionDate: new Date().toISOString()
      };
      
      if (chatHistory) {
        this.usersList[userIndex].chatHistory = chatHistory;
      }

      this.save();
    }
  }

  /**
   * Updates user safety status (warnings/bans)
   */
  updateUserSafety(userId: string, isBanned: boolean, warningCount: number): User | null {
    const userIndex = this.usersList.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.usersList[userIndex].isBanned = isBanned;
      this.usersList[userIndex].warningCount = warningCount;
      this.save();
      return this.usersList[userIndex];
    }
    return null;
  }

  getUser(id: string): User | undefined {
    return this.usersList.find(u => u.id === id);
  }

  findUserByNameAndId(name: string, id: string): User | undefined {
    return this.usersList.find(u => 
      u.id === id && 
      u.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  getAllUsers(): User[] {
    return this.usersList;
  }

  // --- DEVICE SAFETY (For guests/onboarding) ---

  isDeviceBanned(): boolean {
    return localStorage.getItem(DEVICE_BAN_KEY) === 'true';
  }

  banDevice() {
    localStorage.setItem(DEVICE_BAN_KEY, 'true');
  }

  getDeviceWarnings(): number {
    const w = localStorage.getItem(DEVICE_WARNINGS_KEY);
    return w ? parseInt(w, 10) : 0;
  }

  incrementDeviceWarnings(): number {
    const current = this.getDeviceWarnings();
    const next = current + 1;
    localStorage.setItem(DEVICE_WARNINGS_KEY, next.toString());
    return next;
  }
}

// Singleton instance to act as our "Database Connection"
export const db = new MockDatabase();
