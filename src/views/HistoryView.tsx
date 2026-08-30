import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserJournals, toggleFavoriteJournal, deleteJournalEntry } from '../lib/firebase';
import { JournalEntry, MoodType } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate, formatRelativeTime, MOODS, COMMON_TAGS } from '../lib/utils';
import { 
  BookOpen, 
  Search, 
  Star, 
  Trash2, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';

interface HistoryViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ navigate, onShowToast }) => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Deletion modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadJournals();
  }, [user]);

  const loadJournals = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await fetchUserJournals(user.uid);
      setJournals(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      onShowToast('error', 'Failed to load journal history.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    if (!user || !entry.id) return;
    try {
      await toggleFavoriteJournal(user.uid, entry.id, entry.favorite);
      setJournals(journals.map(j => j.id === entry.id ? { ...j, favorite: !j.favorite } : j));
      onShowToast('success', !entry.favorite ? 'Added to favorites ⭐' : 'Removed from favorites');
    } catch (err) {
      onShowToast('error', 'Failed to update favorite.');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!user || !deleteTargetId) return;
    try {
      await deleteJournalEntry(user.uid, deleteTargetId);
      setJournals(journals.filter(j => j.id !== deleteTargetId));
      setDeleteTargetId(null);
      onShowToast('success', 'Journal entry deleted.');
    } catch (err) {
      onShowToast('error', 'Failed to delete journal.');
    }
  };

  // Filtered and sorted dataset
  const filteredJournals = journals.filter((entry) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title.toLowerCase().includes(q);
      const matchContent = entry.content.toLowerCase().includes(q);
      const matchTags = entry.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    // Mood filter
    if (selectedMood !== 'all' && entry.mood !== selectedMood) {
      return false;
    }
    // Tag filter
    if (selectedTag !== 'all' && (!entry.tags || !entry.tags.includes(selectedTag))) {
      return false;
    }
    // Favorites only
    if (favoritesOnly && !entry.favorite) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.createdAt - a.createdAt;
    } else {
      return a.createdAt - b.createdAt;
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            My Journals
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse and filter through your private collection of {journals.length} reflection entries.
          </p>
        </div>

        <button
          onClick={() => navigate('/journal/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-stone-400"
            />
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-medium text-stone-700 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <span>Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          {/* Favorites Filter */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              favoritesOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-500 text-amber-600' : 'text-stone-400'}`} />
            <span>Starred Only</span>
          </button>
        </div>

        {/* Mood & Tag pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Mood:</span>
          <button
            onClick={() => setSelectedMood('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedMood === 'all' ? 'bg-stone-900 text-white font-semibold' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          {(Object.keys(MOODS) as MoodType[]).map((mKey) => (
            <button
              key={mKey}
              onClick={() => setSelectedMood(selectedMood === mKey ? 'all' : mKey)}
              className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                selectedMood === mKey
                  ? `${MOODS[mKey].bgClass} ${MOODS[mKey].borderClass} ${MOODS[mKey].textClass} font-semibold`
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{MOODS[mKey].emoji}</span>
              <span>{MOODS[mKey].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Journal Cards */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-stone-500 text-xs">Loading journal entries...</p>
        </div>
      ) : filteredJournals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJournals.map((entry) => {
            const moodMeta = entry.mood ? MOODS[entry.mood] : null;
            return (
              <div
                key={entry.id}
                onClick={() => navigate(`/journal/${entry.id}`)}
                className="bg-white hover:bg-stone-50/60 border border-stone-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar with Mood & Favorite */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {moodMeta ? (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}>
                          {moodMeta.emoji} {moodMeta.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500">Reflection</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleFavorite(e, entry)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          entry.favorite ? 'text-amber-500 hover:text-amber-600' : 'text-stone-300 hover:text-amber-500'
                        }`}
                        title={entry.favorite ? 'Favorited' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${entry.favorite ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(entry.id || null);
                        }}
                        className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>

                  {/* Content or Summary Preview */}
                  <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                    {entry.summary || entry.content}
                  </p>

                  {/* Reflection indicator if available */}
                  {entry.reflection && (
                    <div className="mt-3 p-2 bg-amber-50/70 border border-amber-200/50 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                      <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">Theme: {entry.reflection.coreTheme}</span>
                    </div>
                  )}
                </div>

                {/* Footer details */}
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags?.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-600">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            No journal entries match your filters
          </h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, mood selection, or clear filters to view all entries.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMood('all');
              setSelectedTag('all');
              setFavoritesOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Journal Entry?"
        message="Are you sure you want to permanently delete this journal entry? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
