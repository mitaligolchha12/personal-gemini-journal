import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserJournals, toggleFavoriteJournal } from '../lib/firebase';
import { JournalEntry } from '../types';
import { formatDate, MOODS } from '../lib/utils';
import { Star, BookOpen, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface FavoritesViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ navigate, onShowToast }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const all = await fetchUserJournals(user.uid);
      setFavorites(all.filter((j) => j.favorite));
    } catch (err) {
      console.error('Error loading favorites:', err);
      onShowToast('error', 'Failed to load favorite entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (e: React.MouseEvent, journal: JournalEntry) => {
    e.stopPropagation();
    if (!user || !journal.id) return;
    try {
      await toggleFavoriteJournal(user.uid, journal.id, true);
      setFavorites(favorites.filter((f) => f.id !== journal.id));
      onShowToast('info', 'Removed from favorites');
    } catch (err) {
      onShowToast('error', 'Failed to remove favorite.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Favorite Journals
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Your starred reflections, milestone entries, and favorite insights.
        </p>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-stone-500 text-xs">Loading favorites...</p>
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((entry) => {
            const moodMeta = entry.mood ? MOODS[entry.mood] : null;
            return (
              <div
                key={entry.id}
                onClick={() => navigate(`/journal/${entry.id}`)}
                className="bg-white hover:bg-stone-50/60 border border-amber-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {moodMeta ? (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}>
                        {moodMeta.emoji} {moodMeta.label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400">Starred Reflection</span>
                    )}

                    <button
                      onClick={(e) => handleUnfavorite(e, entry)}
                      className="p-1.5 text-amber-500 hover:text-stone-400 transition-colors"
                      title="Remove from favorites"
                    >
                      <Star className="w-4 h-4 fill-amber-500" />
                    </button>
                  </div>

                  <h3 className="font-serif font-bold text-base text-stone-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                    {entry.title || 'Untitled Entry'}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-3 mt-2 leading-relaxed">
                    {entry.summary || entry.content}
                  </p>

                  {entry.reflection && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200/60 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-900">
                      <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{entry.reflection.coreTheme}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {formatDate(entry.createdAt)}
                  </span>
                  <span className="text-amber-800 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center">
          <Star className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            No favorite journals yet
          </h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            Star meaningful journal entries to keep them easily accessible here.
          </p>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Browse All Journals
          </button>
        </div>
      )}
    </div>
  );
};
