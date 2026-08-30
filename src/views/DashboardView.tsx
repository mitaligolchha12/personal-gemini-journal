import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchUserJournals, 
  fetchUserGoals, 
  fetchUserThoughtPatterns, 
  saveThoughtPatterns,
  recordJourneyMilestone
} from '../lib/firebase';
import { JournalEntry, GoalItem, ThoughtPattern, ReflectionCardData } from '../types';
import { ReflectionCard } from '../components/ReflectionCard';
import { PatternAlert } from '../components/PatternAlert';
import { detectThoughtPatterns, convertInsightToGoal } from '../services/api';
import { formatDate, formatRelativeTime, MOODS } from '../lib/utils';
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  Target, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Search,
  Star,
  RefreshCw,
  Clock,
  Compass,
  Tag
} from 'lucide-react';

interface DashboardViewProps {
  navigate: (path: string, state?: any) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ navigate, onShowToast }) => {
  const { user, userProfile } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [patterns, setPatterns] = useState<ThoughtPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingPatterns, setAnalyzingPatterns] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [fetchedJournals, fetchedGoals, fetchedPatterns] = await Promise.all([
        fetchUserJournals(user.uid),
        fetchUserGoals(user.uid),
        fetchUserThoughtPatterns(user.uid),
      ]);
      setJournals(fetchedJournals);
      setGoals(fetchedGoals);
      setPatterns(fetchedPatterns);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      onShowToast('error', 'Failed to load some dashboard data. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPatternAnalysis = async () => {
    if (!user || journals.length < 2) {
      onShowToast('info', 'Please create at least 2 journal entries to detect recurring thought patterns.');
      return;
    }

    try {
      setAnalyzingPatterns(true);
      const detected = await detectThoughtPatterns(journals);
      if (detected.length > 0) {
        await saveThoughtPatterns(user.uid, detected);
        const updated = await fetchUserThoughtPatterns(user.uid);
        setPatterns(updated);
        onShowToast('success', `Discovered ${detected.length} recurring thought pattern(s)!`, 'Pattern Analysis Complete');
        
        // Record pattern discovery milestone
        await recordJourneyMilestone(user.uid, {
          type: 'pattern_discovered',
          title: `Pattern: ${detected[0].theme}`,
          description: detected[0].insight,
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
          tag: 'patterns'
        });
      } else {
        onShowToast('info', 'No strong recurring patterns detected yet. Keep journaling!');
      }
    } catch (err: any) {
      console.error('Pattern detection error:', err);
      onShowToast('error', err?.message || 'Failed to analyze thought patterns.');
    } finally {
      setAnalyzingPatterns(false);
    }
  };

  const handleConvertToGoal = async (reflection: ReflectionCardData) => {
    if (!user) return;
    try {
      onShowToast('info', 'Converting reflection into a Smart Goal with Gemini...');
      const converted = await convertInsightToGoal('Reflection Insight', '', reflection);
      // Navigate to Goals view with initial draft
      navigate('/goals', { newGoalDraft: converted });
    } catch (err: any) {
      console.error('Failed to convert reflection to goal:', err);
      onShowToast('error', 'Could not convert reflection to goal.');
    }
  };

  // Metrics calculations
  const totalJournals = journals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedActionsCount = goals.reduce((acc, g) => acc + g.tasks.filter(t => t.completed).length, 0);
  const writingStreak = userProfile?.writingStreak || 1;

  // Latest reflection
  const latestJournalWithReflection = journals.find(j => j.reflection && j.reflection.coreTheme);
  const recentJournals = journals.slice(0, 5);
  const favoriteJournals = journals.filter(j => j.favorite).slice(0, 3);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-stone-600 text-sm font-medium">Loading your reflection workspace...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome & Prompt Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">👋</span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight">
              Welcome back, {user?.displayName ? user.displayName.split(' ')[0] : 'Journaler'}!
            </h1>
          </div>
          <p className="text-stone-300 text-sm sm:text-base font-light max-w-xl">
            What is on your mind today? Take a moment to write, reflect, and discover clarity.
          </p>
        </div>

        <button
          id="dashboard-start-journal-btn"
          onClick={() => navigate('/journal/new')}
          className="flex items-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-sm shadow-md transition-all transform active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4 text-stone-950" />
          <span>Start New Journal</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Journals */}
        <div 
          onClick={() => navigate('/history')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Journals</span>
            <BookOpen className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            {totalJournals}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Total entries logged</p>
        </div>

        {/* Active Goals */}
        <div 
          onClick={() => navigate('/goals')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Goals</span>
            <Target className="w-4 h-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            {activeGoals}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">SMART goals in progress</p>
        </div>

        {/* Completed Actions */}
        <div 
          onClick={() => navigate('/goals')}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Items</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-emerald-700">
            {completedActionsCount}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Tasks checked off</p>
        </div>

        {/* Writing Streak */}
        <div 
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs group"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Writing Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl text-amber-900">
            {writingStreak} <span className="text-xs font-sans font-normal text-stone-500">days</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">Mindful consistency</p>
        </div>
      </div>

      {/* Signature Section: Today's Reflection & Pattern Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Reflection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪞</span>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Today&rsquo;s Reflection
              </h2>
            </div>
            {latestJournalWithReflection && (
              <button
                onClick={() => navigate(`/journal/${latestJournalWithReflection.id}`)}
                className="text-xs font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {latestJournalWithReflection?.reflection ? (
            <ReflectionCard
              reflection={latestJournalWithReflection.reflection}
              journalTitle={latestJournalWithReflection.title}
              onConvertToGoal={handleConvertToGoal}
              onViewJournal={() => navigate(`/journal/${latestJournalWithReflection.id}`)}
            />
          ) : (
            <div className="p-8 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center">
              <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
              <h3 className="font-serif font-semibold text-stone-800 text-sm">
                No reflections generated yet today
              </h3>
              <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
                Write a journal entry and click &ldquo;🪞 Reflect&rdquo; to unlock Gemini&rsquo;s deep observations, thinking questions, and growth suggestions.
              </p>
              <button
                onClick={() => navigate('/journal/new')}
                className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-stone-800 transition-colors"
              >
                Write an Entry
              </button>
            </div>
          )}
        </div>

        {/* Recurring Thought Patterns (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔎</span>
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Thought Patterns
              </h2>
            </div>
            <button
              onClick={handleRunPatternAnalysis}
              disabled={analyzingPatterns}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${analyzingPatterns ? 'animate-spin' : ''}`} />
              <span>{analyzingPatterns ? 'Analyzing...' : 'Discover'}</span>
            </button>
          </div>

          {patterns.length > 0 ? (
            <PatternAlert
              pattern={patterns[0]}
              onOpenJournal={(id) => navigate(`/journal/${id}`)}
              onExploreGoals={() => navigate('/goals')}
            />
          ) : (
            <div className="p-8 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center">
              <Search className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-80" />
              <h3 className="font-serif font-semibold text-stone-800 text-sm">
                Recurring Pattern Discovery
              </h3>
              <p className="text-stone-500 text-xs mt-1 max-w-xs mx-auto">
                As you write, Gemini analyzes recurring curiosities, career questions, and focus areas across your private entries.
              </p>
              <button
                onClick={handleRunPatternAnalysis}
                disabled={analyzingPatterns || journals.length < 2}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {journals.length < 2 ? 'Need 2+ entries to analyze' : 'Analyze Patterns'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Journals & Favorites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Journals (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <h2 className="font-serif font-bold text-lg text-stone-900">
                Recent Journals
              </h2>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
            >
              <span>View All ({journals.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentJournals.length > 0 ? (
            <div className="space-y-3">
              {recentJournals.map((journal) => {
                const moodMeta = journal.mood ? MOODS[journal.mood] : null;
                return (
                  <div
                    key={journal.id}
                    onClick={() => navigate(`/journal/${journal.id}`)}
                    className="p-4 bg-white hover:bg-stone-50/80 border border-stone-200 rounded-2xl shadow-2xs transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {moodMeta && (
                          <span className="text-sm" title={moodMeta.label}>
                            {moodMeta.emoji}
                          </span>
                        )}
                        <h4 className="font-serif font-semibold text-stone-900 text-sm truncate group-hover:text-amber-800 transition-colors">
                          {journal.title || 'Untitled Entry'}
                        </h4>
                        {journal.favorite && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        {journal.summary || journal.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-stone-500 text-[11px]">
                      {journal.tags && journal.tags.length > 0 && (
                        <span className="px-2 py-0.5 bg-stone-100 rounded-md text-stone-600 font-medium">
                          #{journal.tags[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {formatRelativeTime(journal.createdAt)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-stone-500 group-hover:text-stone-700 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-white border border-stone-200 rounded-2xl text-center">
              <p className="text-stone-500 text-xs">Your journal is ready for its first page.</p>
              <button
                onClick={() => navigate('/journal/new')}
                className="mt-3 px-4 py-2 bg-stone-900 text-white text-xs font-medium rounded-lg"
              >
                Create First Entry
              </button>
            </div>
          )}
        </div>

        {/* Quick Highlights / Shortcuts (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Growth Shortcuts
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-2xs">
            <button
              onClick={() => navigate('/journey')}
              className="w-full text-left p-3 rounded-xl bg-amber-50/60 hover:bg-amber-50 border border-amber-200/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-amber-900 block">
                  🗺️ My Journey Timeline
                </span>
                <span className="text-[11px] text-stone-500">
                  Follow your evolution chronologically
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/goals')}
              className="w-full text-left p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-emerald-900 block">
                  🎯 Smart Goals Workspace
                </span>
                <span className="text-[11px] text-stone-500">
                  {activeGoals} active goal{activeGoals !== 1 ? 's' : ''} in progress
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/insights')}
              className="w-full text-left p-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="text-xs font-semibold text-indigo-900 block">
                  📊 Journal Insights
                </span>
                <span className="text-[11px] text-stone-500">
                  Topics, mood balance, & metrics
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
