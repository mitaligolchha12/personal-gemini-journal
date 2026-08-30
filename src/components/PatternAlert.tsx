import React from 'react';
import { ThoughtPattern } from '../types';
import { Search, Sparkles, BookOpen, ArrowRight } from 'lucide-react';

interface PatternAlertProps {
  pattern: ThoughtPattern;
  onOpenJournal?: (id: string) => void;
  onExploreGoals?: () => void;
}

export const PatternAlert: React.FC<PatternAlertProps> = ({
  pattern,
  onOpenJournal,
  onExploreGoals,
}) => {
  if (!pattern) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/90 via-stone-50 to-indigo-100/30 border border-indigo-200/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm shadow-2xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-base text-stone-900">
                Pattern in Your Journal: &ldquo;{pattern.theme}&rdquo;
              </h4>
              <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                {pattern.frequency} Entries
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              AI-detected recurring theme across your private journals
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-700 leading-relaxed my-3">
        {pattern.insight}
      </p>

      {/* Related Entries */}
      {pattern.relatedJournalTitles && pattern.relatedJournalTitles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-indigo-200/50">
          <p className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
            Related Entries
          </p>
          <div className="flex flex-wrap gap-2">
            {pattern.relatedJournalTitles.map((title, idx) => {
              const id = pattern.relatedJournalIds?.[idx];
              return (
                <button
                  key={idx}
                  onClick={() => id && onOpenJournal && onOpenJournal(id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200/70 rounded-lg text-xs font-medium text-stone-800 transition-colors shadow-2xs"
                >
                  <BookOpen className="w-3 h-3 text-indigo-600" />
                  <span className="truncate max-w-[200px]">{title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
