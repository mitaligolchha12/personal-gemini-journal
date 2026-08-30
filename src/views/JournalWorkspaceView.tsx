import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { 
  fetchJournalById, 
  saveJournalEntry, 
  deleteJournalEntry, 
  toggleFavoriteJournal,
  fetchJournalMessages,
  appendJournalMessage,
  saveUserGoal,
  recordJourneyMilestone
} from '../lib/firebase';
import { 
  sendChatMessage, 
  summarizeJournal, 
  generateReflectionCard, 
  brainstormIdeas, 
  generateActionItems,
  convertInsightToGoal,
  BrainstormResult
} from '../services/api';
import { JournalEntry, ChatMessage, ReflectionCardData, MoodType } from '../types';
import { ReflectionCard } from '../components/ReflectionCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate, formatTime, MOODS, COMMON_TAGS } from '../lib/utils';
import { 
  Sparkles, 
  Star, 
  Trash2, 
  Edit3, 
  Save, 
  Send, 
  ArrowLeft, 
  Check, 
  ListChecks, 
  Lightbulb, 
  FileText, 
  Target, 
  Copy, 
  RefreshCw,
  Plus,
  HelpCircle,
  X,
  MessageSquare
} from 'lucide-react';

interface JournalWorkspaceViewProps {
  journalId: string;
  navigate: (path: string, state?: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const JournalWorkspaceView: React.FC<JournalWorkspaceViewProps> = ({
  journalId,
  navigate,
  onShowToast,
}) => {
  const { user } = useAuth();

  // Journal state
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<MoodType | undefined>();
  const [editTags, setEditTags] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Feature States
  const [activeTab, setActiveTab] = useState<'reflection' | 'chat' | 'brainstorm' | 'actions' | 'summary'>('chat');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [brainstormResult, setBrainstormResult] = useState<BrainstormResult | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [brainstormTopic, setBrainstormTopic] = useState('');

  useEffect(() => {
    if (!user || !journalId) return;
    loadJournalAndChat();
  }, [user, journalId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const loadJournalAndChat = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [fetchedJournal, fetchedMessages] = await Promise.all([
        fetchJournalById(user.uid, journalId),
        fetchJournalMessages(user.uid, journalId),
      ]);

      if (!fetchedJournal) {
        onShowToast('error', 'Journal entry not found.');
        navigate('/history');
        return;
      }

      setJournal(fetchedJournal);
      setEditTitle(fetchedJournal.title || '');
      setEditContent(fetchedJournal.content || '');
      setEditMood(fetchedJournal.mood);
      setEditTags(fetchedJournal.tags || []);
      setMessages(fetchedMessages);

      if (fetchedJournal.suggestedActions) {
        setSuggestedActions(fetchedJournal.suggestedActions);
      }

      // If reflection exists, default tab to reflection for a rich start
      if (fetchedJournal.reflection) {
        setActiveTab('reflection');
      }
    } catch (err: any) {
      console.error('Failed to load journal:', err);
      onShowToast('error', 'Failed to load journal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !journal) return;
    try {
      await saveJournalEntry(user.uid, {
        title: editTitle.trim() || 'Untitled Reflection',
        content: editContent.trim(),
        mood: editMood,
        tags: editTags,
        favorite: journal.favorite,
        summary: journal.summary,
        reflection: journal.reflection,
        suggestedActions: journal.suggestedActions,
      }, journal.id);

      setJournal({
        ...journal,
        title: editTitle.trim() || 'Untitled Reflection',
        content: editContent.trim(),
        mood: editMood,
        tags: editTags,
        updatedAt: Date.now(),
      });
      setIsEditing(false);
      onShowToast('success', 'Journal updated successfully.');
    } catch (err: any) {
      console.error('Save edit error:', err);
      onShowToast('error', 'Failed to update journal.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !journal) return;
    try {
      await toggleFavoriteJournal(user.uid, journal.id!, journal.favorite);
      setJournal({ ...journal, favorite: !journal.favorite });
      onShowToast('success', !journal.favorite ? 'Added to favorites ⭐' : 'Removed from favorites');
    } catch (err) {
      onShowToast('error', 'Failed to update favorite status.');
    }
  };

  const handleDeleteJournal = async () => {
    if (!user || !journal) return;
    try {
      await deleteJournalEntry(user.uid, journal.id!);
      onShowToast('success', 'Journal entry deleted.');
      navigate('/history');
    } catch (err) {
      onShowToast('error', 'Failed to delete journal entry.');
    }
  };

  // --- AI Chat ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending || !user || !journal) return;

    const userMessageText = chatInput.trim();
    setChatInput('');

    const newMsg: ChatMessage = {
      role: 'user',
      content: userMessageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsSending(true);

    try {
      // Save user message to Firestore
      await appendJournalMessage(user.uid, journal.id!, newMsg);

      // Call server Gemini API
      const reply = await sendChatMessage(
        userMessageText,
        {
          title: journal.title,
          content: journal.content,
          mood: journal.mood,
          tags: journal.tags,
        },
        messages
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        content: reply,
        timestamp: Date.now(),
      };

      await appendJournalMessage(user.uid, journal.id!, modelMsg);
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      onShowToast('error', err?.message || 'Gemini reflection dialogue failed.');
    } finally {
      setIsSending(false);
    }
  };

  // --- AI Summarize ---
  const handleGenerateSummary = async () => {
    if (!user || !journal) return;
    try {
      setIsSummarizing(true);
      setActiveTab('summary');
      const summaryText = await summarizeJournal(journal.title, journal.content, journal.tags);
      
      await saveJournalEntry(user.uid, {
        ...journal,
        summary: summaryText,
      }, journal.id);

      setJournal({ ...journal, summary: summaryText });
      onShowToast('success', 'Summary generated and saved.');
    } catch (err: any) {
      console.error('Summarize error:', err);
      onShowToast('error', err?.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- AI Reflect ---
  const handleGenerateReflection = async () => {
    if (!user || !journal) return;
    try {
      setIsReflecting(true);
      setActiveTab('reflection');
      const refData = await generateReflectionCard(
        journal.title, 
        journal.content, 
        journal.mood, 
        journal.tags
      );

      await saveJournalEntry(user.uid, {
        ...journal,
        reflection: refData,
      }, journal.id);

      setJournal({ ...journal, reflection: refData });
      onShowToast('success', 'Reflection Card generated!', 'Reflection Complete');
    } catch (err: any) {
      console.error('Reflect error:', err);
      onShowToast('error', err?.message || 'Failed to generate reflection.');
    } finally {
      setIsReflecting(false);
    }
  };

  // --- AI Brainstorm ---
  const handleGenerateBrainstorm = async () => {
    if (!user || !journal) return;
    try {
      setIsBrainstorming(true);
      setActiveTab('brainstorm');
      const res = await brainstormIdeas(journal.title, journal.content, brainstormTopic);
      setBrainstormResult(res);
      onShowToast('success', 'Brainstorming options generated.');
    } catch (err: any) {
      console.error('Brainstorm error:', err);
      onShowToast('error', err?.message || 'Failed to brainstorm.');
    } finally {
      setIsBrainstorming(false);
    }
  };

  // --- AI Action Items ---
  const handleExtractActions = async () => {
    if (!user || !journal) return;
    try {
      setIsExtractingActions(true);
      setActiveTab('actions');
      const actions = await generateActionItems(journal.title, journal.content);
      
      await saveJournalEntry(user.uid, {
        ...journal,
        suggestedActions: actions,
      }, journal.id);

      setSuggestedActions(actions);
      setJournal({ ...journal, suggestedActions: actions });
      onShowToast('success', `Extracted ${actions.length} action items.`);
    } catch (err: any) {
      console.error('Actions error:', err);
      onShowToast('error', err?.message || 'Failed to extract action items.');
    } finally {
      setIsExtractingActions(false);
    }
  };

  // --- Convert to Goal ---
  const handleConvertGoal = async () => {
    if (!user || !journal) return;
    try {
      onShowToast('info', 'Converting journal into a SMART Goal with Gemini...');
      const converted = await convertInsightToGoal(journal.title, journal.content, journal.reflection);
      
      // Save directly or navigate to /goals
      const goalId = await saveUserGoal(user.uid, {
        title: converted.goalTitle,
        description: converted.description,
        category: converted.category,
        sourceJournalId: journal.id,
        progress: 0,
        status: 'active',
        tasks: converted.tasks.map((t, idx) => ({
          id: `task_${Date.now()}_${idx}`,
          text: t,
          completed: false,
        })),
      });

      onShowToast('success', 'Goal established! Redirecting to Goals workspace...', 'Goal Created');
      navigate('/goals');
    } catch (err: any) {
      console.error('Convert goal error:', err);
      onShowToast('error', 'Could not convert insight to goal.');
    }
  };

  if (loading || !journal) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-600 text-sm">Opening journal workspace...</p>
      </div>
    );
  }

  const moodMeta = journal.mood ? MOODS[journal.mood] : null;
  const wordCount = journal.content ? journal.content.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 truncate max-w-md sm:max-w-xl">
                {journal.title || 'Untitled Reflection'}
              </h1>
              {moodMeta && (
                <span className="text-base" title={moodMeta.label}>
                  {moodMeta.emoji}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              Logged on {formatDate(journal.createdAt)} at {formatTime(journal.createdAt)} • {wordCount} words
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-xl border transition-colors shadow-2xs ${
              journal.favorite
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-white border-stone-200 text-stone-400 hover:text-amber-600'
            }`}
            title={journal.favorite ? 'Favorited' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${journal.favorite ? 'fill-amber-500' : ''}`} />
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium shadow-2xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Entry</span>
            </button>
          ) : (
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 bg-white hover:bg-rose-50 border border-stone-200 text-stone-400 hover:text-rose-600 rounded-xl transition-colors shadow-2xs"
            title="Delete Journal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: Journal Content (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
          {isEditing ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full font-serif font-bold text-lg text-stone-900 border-b border-stone-200 pb-2 focus:outline-hidden"
                placeholder="Entry title..."
              />

              {/* Mood selector in edit */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MOODS) as MoodType[]).map((mKey) => (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => setEditMood(editMood === mKey ? undefined : mKey)}
                    className={`px-2.5 py-1 text-xs rounded-lg border ${
                      editMood === mKey ? 'bg-amber-100 border-amber-300 font-semibold text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}
                  >
                    {MOODS[mKey].emoji} {MOODS[mKey].label}
                  </button>
                ))}
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={14}
                className="w-full flex-1 p-3 bg-stone-50 rounded-xl text-stone-800 text-sm leading-relaxed border border-stone-200 focus:outline-hidden focus:border-stone-400 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(journal.title || '');
                    setEditContent(journal.content || '');
                  }}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {moodMeta && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}>
                      {moodMeta.emoji} {moodMeta.label}
                    </span>
                  )}
                  {journal.tags && journal.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Journal Content Display */}
                <div className="prose prose-stone max-w-none text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {journal.content}
                </div>
              </div>

              {/* Bottom word count */}
              <div className="pt-4 mt-6 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Original writing preserved intact</span>
                <span>{wordCount} words</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Reflection Workspace (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          {/* AI Feature Tab Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/80 border-b border-stone-200 overflow-x-auto gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'chat'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat ({messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('reflection')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'reflection'
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <span>🪞 Reflection</span>
                {journal.reflection && <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />}
              </button>

              <button
                onClick={() => setActiveTab('brainstorm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'brainstorm'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>💡 Brainstorm</span>
              </button>

              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'actions'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>🎯 Action Items</span>
              </button>

              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'summary'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📝 Summary</span>
              </button>
            </div>

            {/* Direct convert to goal CTA */}
            <button
              onClick={handleConvertGoal}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs shrink-0"
              title="Convert this journal's reflections directly into a SMART Goal"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Turn into Goal</span>
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto max-h-[500px]">
            {/* 1. CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col justify-between space-y-4">
                {/* Messages list */}
                <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-[320px]">
                  {messages.length === 0 ? (
                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200/60 text-center my-auto">
                      <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <h4 className="font-serif font-semibold text-stone-800 text-sm">
                        Reflective Dialogue with Gemini
                      </h4>
                      <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
                        Ask Gemini to help you unpack what you wrote, ask challenging questions, or explore new angles.
                      </p>
                      
                      {/* Suggested quick openers */}
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {[
                          'What is the core dilemma here?',
                          'What assumptions might I be making?',
                          'How can I view this constructively?'
                        ].map((prompt, idx) => (
                          <button
                            key={idx}
                            onClick={() => setChatInput(prompt)}
                            className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-stone-200 rounded-lg text-xs text-stone-700 transition-colors shadow-2xs"
                          >
                            &ldquo;{prompt}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 text-xs leading-relaxed ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role !== 'user' && (
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl max-w-[85%] ${
                            msg.role === 'user'
                              ? 'bg-stone-900 text-white rounded-br-xs'
                              : 'bg-stone-100 text-stone-800 rounded-bl-xs border border-stone-200'
                          }`}
                        >
                          <div className="prose prose-xs max-w-none">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                          <span className="block text-[10px] opacity-60 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {isSending && (
                    <div className="flex gap-3 text-xs text-stone-500 items-center">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <span className="italic">Gemini is reflecting...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="pt-2 border-t border-stone-100 flex gap-2">
                  <input
                    id="workspace-chat-input"
                    type="text"
                    placeholder="Ask Gemini about your thoughts, questions, or next steps..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isSending}
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:border-stone-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* 2. REFLECTION TAB */}
            {activeTab === 'reflection' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    AI Reflection Card
                  </h3>
                  <button
                    onClick={handleGenerateReflection}
                    disabled={isReflecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isReflecting ? 'animate-spin' : ''}`} />
                    <span>{journal.reflection ? 'Re-generate Reflection' : 'Generate Reflection'}</span>
                  </button>
                </div>

                {journal.reflection ? (
                  <ReflectionCard
                    reflection={journal.reflection}
                    journalTitle={journal.title}
                    onConvertToGoal={handleConvertGoal}
                  />
                ) : (
                  <div className="p-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center">
                    <p className="text-xs text-stone-600 mb-3">
                      Generate an AI Reflection Card to synthesize the core theme, empathetic observation, a thinking question, and an actionable next step.
                    </p>
                    <button
                      onClick={handleGenerateReflection}
                      disabled={isReflecting}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      {isReflecting ? 'Generating...' : 'Generate Reflection Card'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. BRAINSTORM TAB */}
            {activeTab === 'brainstorm' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Idea & Approach Exploration
                    </h3>
                    <p className="text-xs text-stone-500">
                      Explore options, pros & cons, and creative angles.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateBrainstorm}
                    disabled={isBrainstorming}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 self-start sm:self-auto"
                  >
                    {isBrainstorming ? 'Brainstorming...' : 'Brainstorm Approaches'}
                  </button>
                </div>

                {/* Focus input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Specific angle (optional: e.g. How to transition into AI without leaving my job?)..."
                    value={brainstormTopic}
                    onChange={(e) => setBrainstormTopic(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
                  />
                </div>

                {brainstormResult ? (
                  <div className="space-y-3 pt-2">
                    {brainstormResult.ideas.map((idea, idx) => (
                      <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                        <h4 className="font-bold text-stone-900 text-sm">{idea.title}</h4>
                        <p className="text-stone-700 leading-relaxed">{idea.description}</p>
                        
                        {(idea.pros || idea.cons) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stone-200/60">
                            {idea.pros && (
                              <div className="text-emerald-800">
                                <span className="font-semibold block mb-0.5">Pros:</span>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {idea.pros.map((p, pi) => <li key={pi}>{p}</li>)}
                                </ul>
                              </div>
                            )}
                            {idea.cons && (
                              <div className="text-rose-800">
                                <span className="font-semibold block mb-0.5">Considerations:</span>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {idea.cons.map((c, ci) => <li key={ci}>{c}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {brainstormResult.reflectionPrompt && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 font-medium">
                        💡 {brainstormResult.reflectionPrompt}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center">
                    <Lightbulb className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-stone-600">
                      Click Brainstorm to generate distinct paths forward and compare their pros and considerations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. ACTION ITEMS TAB */}
            {activeTab === 'actions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Suggested Action Items
                    </h3>
                    <p className="text-xs text-stone-500">
                      Concrete, realistic tasks derived from your journal thoughts.
                    </p>
                  </div>
                  <button
                    onClick={handleExtractActions}
                    disabled={isExtractingActions}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {isExtractingActions ? 'Extracting...' : 'Extract Actions'}
                  </button>
                </div>

                {suggestedActions.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    {suggestedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs text-stone-800 gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 flex justify-end">
                      <button
                        onClick={handleConvertGoal}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Add as New Smart Goal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center">
                    <ListChecks className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs text-stone-600 mb-3">
                      Extract practical bite-sized tasks from this journal entry.
                    </p>
                    <button
                      onClick={handleExtractActions}
                      disabled={isExtractingActions}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Extract Actions
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. SUMMARY TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Concise Summary
                  </h3>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {isSummarizing ? 'Summarizing...' : journal.summary ? 'Re-generate' : 'Generate Summary'}
                  </button>
                </div>

                {journal.summary ? (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed italic">
                    &ldquo;{journal.summary}&rdquo;
                  </div>
                ) : (
                  <div className="p-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center">
                    <FileText className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs text-stone-600">
                      Generate a quick 2-sentence summary highlighting the core reflection and takeaway.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Journal Entry?"
        message="Are you sure you want to delete this journal entry? This will remove its reflection card, chat dialogue, and milestones permanently from your private storage."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteJournal}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
