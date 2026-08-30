import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  limit,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { sanitizeFirestorePayload } from './utils';
import { JournalEntry, GoalItem, JourneyMilestone, ThoughtPattern, UserProfile, ChatMessage } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom database ID if provided
export const db: Firestore = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Authentication helper
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// -------------------------------------------------------------
// Database Operations with strict User-Isolation & Payload sanitization
// -------------------------------------------------------------

// --- User Profile & Streak ---
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const profileRef = doc(db, 'users', user.uid, 'profile', 'info');
  const snap = await getDoc(profileRef);
  const todayStr = new Date().toISOString().slice(0, 10);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    let newStreak = data.writingStreak || 1;
    if (data.lastActiveDate !== todayStr) {
      // Check if active yesterday
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (data.lastActiveDate === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      await updateDoc(profileRef, sanitizeFirestorePayload({
        writingStreak: newStreak,
        lastActiveDate: todayStr,
        displayName: user.displayName || 'Journaler',
        photoURL: user.photoURL || '',
        email: user.email || '',
        updatedAt: Date.now()
      }));
    }
    return {
      ...data,
      writingStreak: newStreak,
      displayName: user.displayName || data.displayName || 'Journaler',
      photoURL: user.photoURL || data.photoURL || '',
      email: user.email || data.email || ''
    };
  } else {
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Journaler',
      email: user.email || '',
      photoURL: user.photoURL || '',
      writingStreak: 1,
      lastActiveDate: todayStr,
      createdAt: Date.now()
    };
    await setDoc(profileRef, sanitizeFirestorePayload(newProfile));
    return newProfile;
  }
}

// --- Journals ---
export async function fetchUserJournals(userId: string): Promise<JournalEntry[]> {
  const journalsCol = collection(db, 'users', userId, 'journals');
  const q = query(journalsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as JournalEntry));
}

export async function fetchJournalById(userId: string, journalId: string): Promise<JournalEntry | null> {
  const journalRef = doc(db, 'users', userId, 'journals', journalId);
  const snap = await getDoc(journalRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as JournalEntry;
}

export async function saveJournalEntry(
  userId: string, 
  entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
  existingId?: string
): Promise<string> {
  const now = Date.now();
  if (existingId) {
    const journalRef = doc(db, 'users', userId, 'journals', existingId);
    const payload = sanitizeFirestorePayload({
      ...entry,
      updatedAt: now
    });
    await updateDoc(journalRef, payload);
    return existingId;
  } else {
    const journalsCol = collection(db, 'users', userId, 'journals');
    const newDocRef = doc(journalsCol);
    const payload = sanitizeFirestorePayload({
      ...entry,
      userId,
      createdAt: now,
      updatedAt: now
    });
    await setDoc(newDocRef, payload);

    // Auto-record milestone on My Journey
    await recordJourneyMilestone(userId, {
      type: 'journal',
      title: entry.title || 'New Journal Entry',
      description: `Wrote a new reflection: "${entry.title || 'Untitled'}"`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: now,
      relatedId: newDocRef.id,
      tag: entry.tags[0] || 'journal'
    });

    return newDocRef.id;
  }
}

export async function toggleFavoriteJournal(userId: string, journalId: string, currentFavorite: boolean): Promise<void> {
  const journalRef = doc(db, 'users', userId, 'journals', journalId);
  await updateDoc(journalRef, {
    favorite: !currentFavorite,
    updatedAt: Date.now()
  });
}

export async function deleteJournalEntry(userId: string, journalId: string): Promise<void> {
  const journalRef = doc(db, 'users', userId, 'journals', journalId);
  await deleteDoc(journalRef);
}

// --- Multi-turn Gemini Chat Sessions per Journal ---
export async function fetchJournalMessages(userId: string, journalId: string): Promise<ChatMessage[]> {
  const msgsCol = collection(db, 'users', userId, 'sessions', journalId, 'messages');
  const q = query(msgsCol, orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as ChatMessage));
}

export async function appendJournalMessage(userId: string, journalId: string, message: Omit<ChatMessage, 'id'>): Promise<string> {
  const msgsCol = collection(db, 'users', userId, 'sessions', journalId, 'messages');
  const newMsgRef = doc(msgsCol);
  await setDoc(newMsgRef, sanitizeFirestorePayload({
    ...message,
    timestamp: message.timestamp || Date.now()
  }));

  // Update session container
  const sessionRef = doc(db, 'users', userId, 'sessions', journalId);
  await setDoc(sessionRef, {
    journalId,
    updatedAt: Date.now()
  }, { merge: true });

  return newMsgRef.id;
}

// --- Goals & Action Items ---
export async function fetchUserGoals(userId: string): Promise<GoalItem[]> {
  const goalsCol = collection(db, 'users', userId, 'goals');
  const q = query(goalsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as GoalItem));
}

export async function saveUserGoal(
  userId: string, 
  goal: Omit<GoalItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, 
  existingId?: string
): Promise<string> {
  const now = Date.now();
  if (existingId) {
    const goalRef = doc(db, 'users', userId, 'goals', existingId);
    await updateDoc(goalRef, sanitizeFirestorePayload({
      ...goal,
      updatedAt: now
    }));
    return existingId;
  } else {
    const goalsCol = collection(db, 'users', userId, 'goals');
    const newDocRef = doc(goalsCol);
    await setDoc(newDocRef, sanitizeFirestorePayload({
      ...goal,
      userId,
      createdAt: now,
      updatedAt: now
    }));

    // Record on My Journey
    await recordJourneyMilestone(userId, {
      type: 'goal_created',
      title: `Goal: ${goal.title}`,
      description: `Established a new smart goal with ${goal.tasks.length} action items.`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: now,
      relatedId: newDocRef.id,
      tag: goal.category || 'goals'
    });

    return newDocRef.id;
  }
}

export async function updateGoalProgress(userId: string, goalId: string, tasks: GoalItem['tasks']): Promise<void> {
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const status = progress === 100 ? 'completed' : 'active';
  
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await updateDoc(goalRef, sanitizeFirestorePayload({
    tasks,
    progress,
    status,
    updatedAt: Date.now()
  }));
}

export async function deleteUserGoal(userId: string, goalId: string): Promise<void> {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  await deleteDoc(goalRef);
}

// --- Journey Milestones ---
export async function recordJourneyMilestone(userId: string, milestone: Omit<JourneyMilestone, 'id' | 'userId'>): Promise<string> {
  const journeyCol = collection(db, 'users', userId, 'journey');
  const newDoc = doc(journeyCol);
  await setDoc(newDoc, sanitizeFirestorePayload({
    ...milestone,
    userId,
    timestamp: milestone.timestamp || Date.now()
  }));
  return newDoc.id;
}

export async function fetchJourneyMilestones(userId: string): Promise<JourneyMilestone[]> {
  const journeyCol = collection(db, 'users', userId, 'journey');
  const q = query(journeyCol, orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as JourneyMilestone));
}

// --- Thought Patterns ---
export async function saveThoughtPatterns(userId: string, patterns: Omit<ThoughtPattern, 'id' | 'userId'>[]): Promise<void> {
  const patternsCol = collection(db, 'users', userId, 'patterns');
  for (const pat of patterns) {
    const newDoc = doc(patternsCol);
    await setDoc(newDoc, sanitizeFirestorePayload({
      ...pat,
      userId,
      lastDetectedAt: Date.now()
    }));
  }
}

export async function fetchUserThoughtPatterns(userId: string): Promise<ThoughtPattern[]> {
  const patternsCol = collection(db, 'users', userId, 'patterns');
  const q = query(patternsCol, orderBy('lastDetectedAt', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  } as ThoughtPattern));
}
