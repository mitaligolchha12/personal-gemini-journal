import React from 'react';
import { ReflectionCardData } from '../types';
import { Sparkles, HelpCircle, ArrowRight, Target, BookmarkCheck } from 'lucide-react';

interface ReflectionCardProps {
  reflection: ReflectionCardData;
  journalTitle?: string;
  onConvertToGoal?: (reflection: ReflectionCardData) => void;
  onViewJournal?: () => void;
  compact?: boolean;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  reflection,
  journalTitle,
  onConvertToGoal,
  onViewJournal,
  compact = false,
}) => {
  if (!reflection) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50/90 via-stone-50 to-amber-100/40 border border-amber-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-amber-200/30 to-transparent pointer-events-none rounded-bl-full" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪞</span>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
              {reflection.coreTheme || "Today's Reflection"}
            </h3>
            {journalTitle && (
              <p className="text-[11px] text-stone-500 truncate max-w-xs">
                Reflecting on: {journalTitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100/80 border border-amber-300/60 rounded-full text-[11px] font-medium text-amber-800">
          <Sparkles className="w-3 h-3 text-amber-700" />
          <span>Gemini Insight</span>
        </div>
      </div>

      {/* Observation */}
      <p className="text-sm text-stone-800 leading-relaxed font-normal mb-4">
        {reflection.observation}
      </p>

      {/* Sub-sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-amber-200/60">
        {/* Think About */}
        {reflection.thinkAbout && (
          <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-200/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 mb-1">
              <span className="text-sm">💭</span>
              <span>Think About</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {reflection.thinkAbout}
            </p>
          </div>
        )}

        {/* Possible Next Step */}
        {reflection.possibleNextStep && (
          <div className="p-3 bg-white/80 backdrop-blur-xs rounded-xl border border-amber-200/50">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1">
              <span className="text-sm">🎯</span>
              <span>Possible Next Step</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed">
              {reflection.possibleNextStep}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onConvertToGoal || onViewJournal) && (
        <div className="flex items-center justify-end gap-2 mt-4 pt-2">
          {onViewJournal && (
            <button
              onClick={onViewJournal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-black/5 rounded-lg transition-colors"
            >
              <span>View Entry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onConvertToGoal && (
            <button
              onClick={() => onConvertToGoal(reflection)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-xs transition-all"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Turn into Goal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
