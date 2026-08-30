import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserJournals } from '../lib/firebase';
import { JournalEntry } from '../types';
import { formatDate, MOODS } from '../lib/utils';
import { Search as SearchIcon, BookOpen, ArrowRight, Clock, Sparkles, Filter } from 'lucide-react';

interface SearchViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ navigate, onShowToast }) => {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);

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
      console.error('Search load error:', err);
      onShowToast('error', 'Failed to load journals for search.');
    } finally {
      setLoading(false);
    }
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(journals.flatMap((j) => j.tags || [])));

  // Filtered results
  const results = journals.filter((entry) => {
    if (!searchQuery.trim() && selectedTag === 'all') return true;

    const q = searchQuery.toLowerCase().trim();
    let matchesQuery = true;
    if (q) {
      const matchTitle = (entry.title || '').toLowerCase().includes(q);
      const matchContent = (entry.content || '').toLowerCase().includes(q);
      const matchTags = (entry.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchSummary = (entry.summary || '').toLowerCase().includes(q);
      const matchReflection = (entry.reflection?.coreTheme || '').toLowerCase().includes(q);
      matchesQuery = matchTitle || matchContent || matchTags || matchSummary || matchReflection;
    }

    let matchesTag = true;
    if (selectedTag !== 'all') {
      matchesTag = (entry.tags || []).includes(selectedTag);
    }

    return matchesQuery && matchesTag;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-stone-900" />
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Journal Search
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Instant full-text and tag discovery across your private reflections.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="relative">
          <SearchIcon className="w-5 h-5 text-stone-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search keywords, reflections, thoughts (e.g., 'career', 'learning', 'uncertainty')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm sm:text-base text-stone-900 focus:outline-hidden focus:border-stone-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">Tags:</span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results List */}
      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-stone-500 text-xs">Searching entries...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((entry) => {
              const moodMeta = entry.mood ? MOODS[entry.mood] : null;
              return (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/journal/${entry.id}`)}
                  className="p-5 bg-white hover:bg-stone-50/80 border border-stone-200 rounded-2xl shadow-2xs transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {moodMeta && (
                        <span className="text-sm" title={moodMeta.label}>
                          {moodMeta.emoji}
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      {entry.reflection && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          Reflection Ready
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {entry.summary || entry.content}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags?.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[11px]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 text-[11px] text-stone-500 gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatDate(entry.createdAt)}
                    </span>
                    <span className="text-amber-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center">
            <SearchIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-stone-800 text-base">
              No matching entries found
            </h3>
            <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
              Try different search terms or write a new journal entry to expand your collection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
