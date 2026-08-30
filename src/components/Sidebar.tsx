import React from 'react';
import { 
  Plus, 
  Sparkles, 
  BookOpen, 
  Star, 
  Target, 
  Compass, 
  BarChart3, 
  Search, 
  Settings,
  Flame,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
  journalCount?: number;
  goalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPath, 
  navigate, 
  journalCount = 0,
  goalCount = 0 
}) => {
  const { userProfile } = useAuth();

  const mainNav = [
    { label: 'Dashboard', path: '/dashboard', icon: Sparkles },
    { label: 'My Journals', path: '/history', icon: BookOpen, count: journalCount },
    { label: 'Favorites', path: '/favorites', icon: Star },
    { label: 'Smart Goals', path: '/goals', icon: Target, count: goalCount },
    { label: 'My Journey', path: '/journey', icon: Compass },
    { label: 'Insights', path: '/insights', icon: BarChart3 },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col bg-white border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4">
      {/* Action Button */}
      <button
        id="sidebar-new-journal-btn"
        onClick={() => navigate('/journal/new')}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-medium shadow-sm transition-all transform active:scale-98 mb-6"
      >
        <Plus className="w-4 h-4" />
        <span>New Journal</span>
      </button>

      {/* Nav Menu */}
      <div className="space-y-1 flex-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-2">
          Workspace
        </p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </div>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-stone-100 text-stone-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mindful Writing Streak Widget */}
      <div className="mt-auto pt-4 border-t border-stone-100">
        <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-stone-50 border border-amber-200/60 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1 rounded-md bg-amber-100 text-amber-700">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-stone-900">
              Writing Streak
            </span>
          </div>
          <p className="text-xl font-serif font-bold text-amber-900">
            {userProfile?.writingStreak || 1} <span className="text-xs font-sans font-normal text-stone-500">consecutive days</span>
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Keep reflecting daily to deepen self-awareness.
          </p>
        </div>
      </div>
    </aside>
  );
};
