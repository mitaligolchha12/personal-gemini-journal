import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserJournals, fetchUserGoals } from '../lib/firebase';
import { JournalEntry, GoalItem, MoodType } from '../types';
import { MOODS } from '../lib/utils';
import { 
  BarChart3, 
  Flame, 
  BookOpen, 
  Target, 
  Sparkles, 
  ShieldAlert, 
  Smile, 
  TrendingUp, 
  Tag as TagIcon 
} from 'lucide-react';

interface InsightsViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ navigate, onShowToast }) => {
  const { user, userProfile } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [jData, gData] = await Promise.all([
        fetchUserJournals(user.uid),
        fetchUserGoals(user.uid),
      ]);
      setJournals(jData);
      setGoals(gData);
    } catch (err) {
      console.error('Insights error:', err);
      onShowToast('error', 'Failed to load insights.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalEntries = journals.length;
  const totalWords = journals.reduce((acc, j) => acc + (j.content ? j.content.trim().split(/\s+/).length : 0), 0);
  const totalReflections = journals.filter((j) => j.reflection && j.reflection.coreTheme).length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const totalActions = goals.reduce((acc, g) => acc + g.tasks.length, 0);
  const completedActions = goals.reduce((acc, g) => acc + g.tasks.filter((t) => t.completed).length, 0);

  // Mood distribution
  const moodCounts: Record<string, number> = {};
  journals.forEach((j) => {
    if (j.mood) {
      moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
    }
  });

  // Tag frequency
  const tagCounts: Record<string, number> = {};
  journals.forEach((j) => {
    j.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-stone-900" />
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Journal Insights & Analytics
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Descriptive patterns and writing trends across your private reflections.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Entries</span>
            <BookOpen className="w-4 h-4 text-stone-400" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">{totalEntries}</p>
          <p className="text-[11px] text-stone-500 mt-1">{totalWords.toLocaleString()} words written</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reflections</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-amber-900">{totalReflections}</p>
          <p className="text-[11px] text-stone-500 mt-1">AI synthesis cards</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Goals Finished</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-emerald-800">{completedGoals}</p>
          <p className="text-[11px] text-stone-500 mt-1">{completedActions} of {totalActions} tasks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-amber-900">{userProfile?.writingStreak || 1}</p>
          <p className="text-[11px] text-stone-500 mt-1">Active consecutive days</p>
        </div>
      </div>

      {/* Main Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Smile className="w-4 h-4 text-amber-600" />
              <span>Mood Distribution</span>
            </h3>
            <span className="text-[11px] text-stone-500">
              {Object.values(moodCounts).reduce((a, b) => a + b, 0)} tagged entries
            </span>
          </div>

          {Object.keys(moodCounts).length > 0 ? (
            <div className="space-y-3 pt-2">
              {Object.entries(moodCounts).map(([mKey, count]) => {
                const meta = MOODS[mKey as MoodType];
                const pct = Math.round((count / totalEntries) * 100) || 0;
                return (
                  <div key={mKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{meta?.emoji || '📝'}</span>
                        <span className="font-medium text-stone-800">{meta?.label || mKey}</span>
                      </div>
                      <span className="font-semibold text-stone-700">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-8">
              Select moods when writing journal entries to visualize your emotional rhythm here.
            </p>
          )}
        </div>

        {/* Focus Areas & Topics */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-indigo-600" />
              <span>Top Focus Topics</span>
            </h3>
            <span className="text-[11px] text-stone-500">{sortedTags.length} distinct tags</span>
          </div>

          {sortedTags.length > 0 ? (
            <div className="space-y-3 pt-2">
              {sortedTags.slice(0, 6).map(([tag, count]) => {
                const pct = Math.round((count / totalEntries) * 100) || 0;
                return (
                  <div key={tag} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">#{tag}</span>
                      <span className="font-semibold text-stone-700">
                        {count} entries ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-500 text-center py-8">
              Add tags like #career, #learning, and #goals to track your key discussion topics.
            </p>
          )}
        </div>
      </div>

      {/* Safety & Non-Diagnostic Disclaimer Banner */}
      <div className="p-4 bg-stone-100/80 border border-stone-300/80 rounded-2xl flex items-start gap-3 text-xs text-stone-600">
        <ShieldAlert className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-semibold text-stone-800">Privacy & Observational Purpose</p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            These analytics describe your self-logged writing frequency, topics, and moods. Personal Gemini Journal does not provide psychological, clinical, or medical diagnoses.
          </p>
        </div>
      </div>
    </div>
  );
};
