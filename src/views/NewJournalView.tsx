import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveJournalEntry } from '../lib/firebase';
import { generateReflectionCard } from '../services/api';
import { MoodType } from '../types';
import { MOODS, COMMON_TAGS, saveLocalDraft, getLocalDraft, clearLocalDraft } from '../lib/utils';
import { 
  Sparkles, 
  Save, 
  ArrowLeft, 
  Tag as TagIcon, 
  Trash2, 
  AlertCircle, 
  Check, 
  Flame,
  Plus
} from 'lucide-react';

interface NewJournalViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const NewJournalView: React.FC<NewJournalViewProps> = ({ navigate, onShowToast }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType | undefined>('thoughtful');
  const [tags, setTags] = useState<string[]>(['career']);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [draftRestored, setDraftRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reflectingOnSave, setReflectingOnSave] = useState(false);

  // Auto-restore draft on mount
  useEffect(() => {
    if (!user) return;
    const existingDraft = getLocalDraft(user.uid);
    if (existingDraft && (existingDraft.title || existingDraft.content)) {
      setTitle(existingDraft.title || '');
      setContent(existingDraft.content || '');
      if (existingDraft.mood) setMood(existingDraft.mood);
      if (Array.isArray(existingDraft.tags) && existingDraft.tags.length > 0) {
        setTags(existingDraft.tags);
      }
      setDraftRestored(true);
    }
  }, [user]);

  // Debounced draft auto-save
  useEffect(() => {
    if (!user) return;
    if (title.trim() || content.trim()) {
      const timer = setTimeout(() => {
        saveLocalDraft(user.uid, { title, content, mood, tags });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, title, content, mood, tags]);

  const handleDiscardDraft = () => {
    if (!user) return;
    clearLocalDraft(user.uid);
    setTitle('');
    setContent('');
    setMood('thoughtful');
    setTags(['career']);
    setDraftRestored(false);
    onShowToast('info', 'Local draft discarded.');
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setCustomTagInput('');
    }
  };

  const handleSave = async (andReflect: boolean = false) => {
    if (!user) return;

    if (!content.trim()) {
      onShowToast('error', 'Please write some thoughts before saving.');
      return;
    }

    try {
      if (andReflect) {
        setReflectingOnSave(true);
      } else {
        setSaving(true);
      }

      let reflectionData;
      if (andReflect) {
        try {
          reflectionData = await generateReflectionCard(
            title || 'Thoughts',
            content,
            mood,
            tags
          );
        } catch (aiErr) {
          console.warn('AI reflection on save failed, saving journal anyway:', aiErr);
        }
      }

      const journalId = await saveJournalEntry(user.uid, {
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        mood,
        tags,
        favorite: false,
        reflection: reflectionData,
      });

      // Clear local draft upon confirmed save
      clearLocalDraft(user.uid);

      onShowToast('success', andReflect ? 'Journal saved with Gemini Reflection!' : 'Journal saved successfully.');
      navigate(`/journal/${journalId}`);
    } catch (err: any) {
      console.error('Save journal error:', err);
      onShowToast('error', err?.message || 'Failed to save journal. Your text is safe.');
    } finally {
      setSaving(false);
      setReflectingOnSave(false);
    }
  };

  // Metrics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded-xl transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-900">
              New Journal Entry
            </h1>
            <p className="text-xs text-stone-500">
              Write freely. Gemini helps you uncover reflections, themes, and goals.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="save-journal-btn"
            onClick={() => handleSave(false)}
            disabled={saving || reflectingOnSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Journal'}</span>
          </button>

          <button
            id="save-and-reflect-btn"
            onClick={() => handleSave(true)}
            disabled={saving || reflectingOnSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all transform active:scale-98 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{reflectingOnSave ? 'Reflecting with Gemini...' : 'Save & Reflect with Gemini'}</span>
          </button>
        </div>
      </div>

      {/* Draft Restored Banner */}
      {draftRestored && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Unsaved local draft restored from previous session.</span>
          </div>
          <button
            onClick={handleDiscardDraft}
            className="text-stone-600 hover:text-rose-700 underline font-medium text-[11px]"
          >
            Discard Draft
          </button>
        </div>
      )}

      {/* Main Journal Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title Input */}
        <div>
          <input
            id="journal-title-input"
            type="text"
            placeholder="Give your thoughts a title (e.g., Navigating Career Direction & AI)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xl sm:text-2xl font-serif font-bold text-stone-900 placeholder:text-stone-400 border-none outline-hidden focus:ring-0 p-0"
          />
        </div>

        {/* Mood Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
            How are you feeling? (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOODS) as MoodType[]).map((mKey) => {
              const meta = MOODS[mKey];
              const isSelected = mood === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setMood(isSelected ? undefined : mKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? `${meta.bgClass} ${meta.borderClass} ${meta.textClass} font-semibold ring-1 ring-amber-400/50 shadow-2xs`
                      : 'bg-stone-50/70 border-stone-200 text-stone-600 hover:bg-stone-100/70'
                  }`}
                >
                  <span className="text-sm">{meta.emoji}</span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Textarea */}
        <div className="relative">
          <textarea
            id="journal-content-textarea"
            rows={12}
            placeholder="Write freely about your ideas, challenges, reflections, goals, or what happened today..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-stone-800 text-sm sm:text-base leading-relaxed placeholder:text-stone-400 border-stone-200 rounded-2xl focus:border-stone-400 focus:ring-1 focus:ring-stone-400 p-4 outline-hidden bg-stone-50/40 resize-y"
          />

          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 px-1">
            <span>{wordCount} words • ~{readingTime} min read</span>
            <span className="italic">Auto-saved to local browser storage</span>
          </div>
        </div>

        {/* Tags Selector */}
        <div className="pt-4 border-t border-stone-100">
          <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
            Tags & Focus Areas
          </label>
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {COMMON_TAGS.map((t) => {
              const isSelected = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleTag(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>

          {/* Custom tag input */}
          <form onSubmit={handleAddCustomTag} className="flex items-center gap-2 max-w-xs">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-stone-500 text-xs">#</span>
              <input
                type="text"
                placeholder="add custom tag..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                className="w-full pl-6 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-400"
              />
            </div>
            <button
              type="submit"
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
