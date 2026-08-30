import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchJourneyMilestones, recordJourneyMilestone } from '../lib/firebase';
import { JourneyMilestone } from '../types';
import { formatDate, formatTime } from '../lib/utils';
import { 
  Compass, 
  Sparkles, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  Search, 
  Plus, 
  Calendar,
  ArrowRight,
  Milestone
} from 'lucide-react';

interface JourneyViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ navigate, onShowToast }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom milestone modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customTag, setCustomTag] = useState('milestone');

  useEffect(() => {
    if (!user) return;
    loadJourney();
  }, [user]);

  const loadJourney = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchJourneyMilestones(user.uid);
      setMilestones(data);
    } catch (err) {
      console.error('Failed to load journey:', err);
      onShowToast('error', 'Failed to load timeline.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customTitle.trim()) return;

    try {
      await recordJourneyMilestone(user.uid, {
        type: 'journal',
        title: customTitle.trim(),
        description: customDesc.trim() || 'Personal growth achievement unlocked.',
        date: new Date().toISOString().slice(0, 10),
        timestamp: Date.now(),
        tag: customTag,
      });

      setCustomTitle('');
      setCustomDesc('');
      setShowAddModal(false);
      onShowToast('success', 'Milestone added to your timeline.');
      loadJourney();
    } catch (err) {
      onShowToast('error', 'Failed to record milestone.');
    }
  };

  const getMilestoneIcon = (type: JourneyMilestone['type']) => {
    switch (type) {
      case 'journal':
        return <BookOpen className="w-4 h-4 text-amber-700" />;
      case 'reflection':
        return <Sparkles className="w-4 h-4 text-indigo-700" />;
      case 'goal_created':
        return <Target className="w-4 h-4 text-blue-700" />;
      case 'action_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
      case 'pattern_discovered':
        return <Search className="w-4 h-4 text-purple-700" />;
      default:
        return <Milestone className="w-4 h-4 text-stone-700" />;
    }
  };

  const getMilestoneBadge = (type: JourneyMilestone['type']) => {
    switch (type) {
      case 'journal':
        return 'bg-amber-100/70 text-amber-900 border-amber-200';
      case 'reflection':
        return 'bg-indigo-100/70 text-indigo-900 border-indigo-200';
      case 'goal_created':
        return 'bg-blue-100/70 text-blue-900 border-blue-200';
      case 'action_completed':
        return 'bg-emerald-100/70 text-emerald-900 border-emerald-200';
      case 'pattern_discovered':
        return 'bg-purple-100/70 text-purple-900 border-purple-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-stone-900" />
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
              My Journey Timeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            An evolving, chronological story of your thoughts, reflections, milestones, and breakthroughs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Milestone</span>
        </button>
      </div>

      {/* Add Custom Milestone Dialog */}
      {showAddModal && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Record a Personal Growth Milestone
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddCustomMilestone} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Milestone Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Completed AI Studio Cloud Run Challenge deployment"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Note or Reflection
              </label>
              <textarea
                rows={2}
                placeholder="What did you learn or overcome?"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Save Milestone
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline Stream */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-stone-500 text-xs">Tracing your journey...</p>
        </div>
      ) : milestones.length > 0 ? (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-200/80 space-y-6 my-6">
          {milestones.map((item, index) => (
            <div key={item.id || index} className="relative group">
              {/* Timeline dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center shadow-xs">
                {getMilestoneIcon(item.type)}
              </div>

              {/* Milestone Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs group-hover:border-amber-200/80 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getMilestoneBadge(item.type)}`}>
                      {item.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {item.title}
                    </h3>
                  </div>

                  <span className="text-[11px] text-stone-400 font-medium">
                    {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {item.description}
                </p>

                {/* Footer details */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 text-[11px]">
                  {item.tag && (
                    <span className="text-stone-500 font-medium">
                      #{item.tag}
                    </span>
                  )}

                  {item.relatedId && item.type === 'journal' && (
                    <button
                      onClick={() => navigate(`/journal/${item.relatedId}`)}
                      className="text-amber-800 font-semibold flex items-center gap-1 hover:underline ml-auto"
                    >
                      <span>Read Entry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {item.relatedId && item.type === 'goal_created' && (
                    <button
                      onClick={() => navigate('/goals')}
                      className="text-emerald-800 font-semibold flex items-center gap-1 hover:underline ml-auto"
                    >
                      <span>View Goal</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center">
          <Compass className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            Your timeline is just getting started
          </h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            As you write journal entries, generate AI reflections, and accomplish goals, milestones will appear automatically on your journey.
          </p>
          <button
            onClick={() => navigate('/journal/new')}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Write First Entry
          </button>
        </div>
      )}
    </div>
  );
};
