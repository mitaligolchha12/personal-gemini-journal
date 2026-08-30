export type MoodType = 
  | 'happy' 
  | 'calm' 
  | 'thoughtful' 
  | 'neutral' 
  | 'sad' 
  | 'frustrated' 
  | 'motivated' 
  | 'grateful';

export interface MoodMeta {
  type: MoodType;
  emoji: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface ReflectionCardData {
  coreTheme: string;
  observation: string;
  thinkAbout: string;
  possibleNextStep: string;
  generatedAt?: string;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  content: string;
  mood?: MoodType;
  tags: string[];
  favorite: boolean;
  summary?: string;
  reflection?: ReflectionCardData;
  suggestedActions?: string[];
  createdAt: number; // epoch ms or server timestamp
  updatedAt: number;
}

export interface GoalTask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number;
}

export interface GoalItem {
  id?: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  sourceJournalId?: string;
  progress: number; // 0 to 100
  status: 'active' | 'completed' | 'paused';
  targetDate?: string;
  tasks: GoalTask[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ThoughtPattern {
  id?: string;
  userId?: string;
  theme: string;
  frequency: number;
  insight: string;
  relatedJournalIds: string[];
  relatedJournalTitles: string[];
  lastDetectedAt: number;
}

export interface JourneyMilestone {
  id?: string;
  userId: string;
  type: 'journal' | 'reflection' | 'goal_created' | 'action_completed' | 'pattern_discovered';
  title: string;
  description: string;
  date: string; // YYYY-MM-DD or formatted string
  timestamp: number;
  relatedId?: string;
  tag?: string;
  iconName?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  writingStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  createdAt: number;
}
