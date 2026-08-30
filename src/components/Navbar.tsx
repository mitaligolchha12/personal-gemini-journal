import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Flame, 
  Plus, 
  LogOut, 
  Menu, 
  X, 
  BookOpen, 
  Target, 
  Compass, 
  BarChart3, 
  Search, 
  Star,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { user, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Sparkles },
    { label: 'My Journals', path: '/history', icon: BookOpen },
    { label: 'Favorites', path: '/favorites', icon: Star },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'My Journey', path: '/journey', icon: Compass },
    { label: 'Insights', path: '/insights', icon: BarChart3 },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight block leading-tight">
                Personal Gemini Journal
              </span>
              <span className="text-[11px] font-medium text-stone-500 hidden sm:block">
                AI Reflection & Growth Workspace
              </span>
            </div>
          </div>

          {/* Desktop Right items */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Streak badge */}
                <div 
                  className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold shadow-2xs"
                  title="Your consecutive active writing streak"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{userProfile?.writingStreak || 1} Day Streak</span>
                </div>

                {/* Quick New Journal CTA */}
                <button
                  id="navbar-new-journal-btn"
                  onClick={() => navigate('/journal/new')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Entry</span>
                </button>

                {/* User details */}
                <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-semibold text-stone-700">
                      {(user.displayName || 'U')[0]}
                    </div>
                  )}
                  <span className="text-xs font-medium text-stone-700 max-w-[120px] truncate">
                    {user.displayName || 'Journaler'}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
                >
                  Sign In with Google
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => navigate('/journal/new')}
                className="p-2 bg-stone-900 text-white rounded-lg text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {user ? (
            <>
              <div className="flex items-center gap-3 py-2 px-3 bg-stone-50 rounded-lg mb-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">{user.displayName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-amber-600" />
                  <span>{userProfile?.writingStreak || 1}d</span>
                </div>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-amber-700' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-2">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-xs font-medium text-center shadow-xs"
              >
                Sign In with Google
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
