import { ReflectionCardData } from '../types';

export interface BrainstormResult {
  focusSummary?: string;
  ideas: Array<{
    title: string;
    description: string;
    pros?: string[];
    cons?: string[];
  }>;
  reflectionPrompt?: string;
}

export interface ConvertedGoalResult {
  goalTitle: string;
  description: string;
  category: string;
  tasks: string[];
}

export interface ThoughtPatternResult {
  theme: string;
  frequency: number;
  insight: string;
  relatedJournalIds: string[];
  relatedJournalTitles: string[];
}

export async function sendChatMessage(
  message: string,
  journalContext: { title: string; content: string; mood?: string; tags?: string[] },
  history: Array<{ role: 'user' | 'model' | 'assistant'; content: string }>
): Promise<string> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, journalContext, history }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to communicate with Gemini reflection service.');
  }
  const data = await res.json();
  return data.reply;
}

export async function summarizeJournal(title: string, content: string, tags: string[] = []): Promise<string> {
  const res = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, tags }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate summary.');
  }
  const data = await res.json();
  return data.summary;
}

export async function generateReflectionCard(
  title: string, 
  content: string, 
  mood?: string, 
  tags: string[] = []
): Promise<ReflectionCardData> {
  const res = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, mood, tags }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate reflection card.');
  }
  return await res.json();
}

export async function brainstormIdeas(
  title: string, 
  content: string, 
  focusTopic?: string
): Promise<BrainstormResult> {
  const res = await fetch('/api/gemini/brainstorm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, focusTopic }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to brainstorm ideas.');
  }
  return await res.json();
}

export async function generateActionItems(title: string, content: string): Promise<string[]> {
  const res = await fetch('/api/gemini/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to extract action items.');
  }
  const data = await res.json();
  return data.actions || [];
}

export async function convertInsightToGoal(
  title: string, 
  content: string, 
  reflection?: ReflectionCardData, 
  insightText?: string
): Promise<ConvertedGoalResult> {
  const res = await fetch('/api/gemini/convert-to-goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, reflection, insightText }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to convert insight to goal.');
  }
  return await res.json();
}

export async function detectThoughtPatterns(entries: Array<{
  id?: string;
  title: string;
  content: string;
  createdAt: number;
  tags: string[];
  mood?: string;
}>): Promise<ThoughtPatternResult[]> {
  const res = await fetch('/api/gemini/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze thought patterns.');
  }
  const data = await res.json();
  return data.patterns || [];
}
