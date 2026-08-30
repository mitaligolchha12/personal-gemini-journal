import { MoodMeta, MoodType } from '../types';

export const MOODS: Record<MoodType, MoodMeta> = {
  happy: {
    type: 'happy',
    emoji: '😊',
    label: 'Happy',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200'
  },
  calm: {
    type: 'calm',
    emoji: '😌',
    label: 'Calm',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200'
  },
  thoughtful: {
    type: 'thoughtful',
    emoji: '🤔',
    label: 'Thoughtful',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200'
  },
  neutral: {
    type: 'neutral',
    emoji: '😐',
    label: 'Neutral',
    bgClass: 'bg-stone-100',
    textClass: 'text-stone-700',
    borderClass: 'border-stone-200'
  },
  sad: {
    type: 'sad',
    emoji: '😔',
    label: 'Sad',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200'
  },
  frustrated: {
    type: 'frustrated',
    emoji: '😤',
    label: 'Frustrated',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200'
  },
  motivated: {
    type: 'motivated',
    emoji: '🚀',
    label: 'Motivated',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200'
  },
  grateful: {
    type: 'grateful',
    emoji: '❤️',
    label: 'Grateful',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-200'
  }
};

export const COMMON_TAGS = [
  'career',
  'learning',
  'college',
  'projects',
  'goals',
  'personal',
  'habits',
  'creativity',
  'wellness'
];

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively strips all undefined properties before sending to Firestore SDK.
 */
export function sanitizeFirestorePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestorePayload) as unknown as T;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeFirestorePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export function formatDate(timestamp: number | string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' || typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatTime(timestamp: number | string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' || typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

// Local Draft Recovery storage keys
const DRAFT_KEY_PREFIX = 'gemini_journal_draft_';

export function saveLocalDraft(userId: string, draft: { title: string; content: string; mood?: MoodType; tags: string[] }) {
  try {
    const payload = {
      ...draft,
      savedAt: Date.now()
    };
    localStorage.setItem(`${DRAFT_KEY_PREFIX}${userId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save local draft:', err);
  }
}

export function getLocalDraft(userId: string): { title: string; content: string; mood?: MoodType; tags: string[]; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read local draft:', err);
    return null;
  }
}

export function clearLocalDraft(userId: string) {
  try {
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${userId}`);
  } catch (err) {
    console.warn('Failed to clear local draft:', err);
  }
}
