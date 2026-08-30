import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { user, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, go to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err?.message || 'Google sign-in was interrupted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white mx-auto shadow-sm mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-stone-900">
            Welcome to Personal Gemini Journal
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Sign in with Google to enter your private AI reflection and growth workspace.
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sign-in Notice</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          id="google-signin-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-sm font-semibold shadow-2xs hover:shadow-xs transition-all transform active:scale-98 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        {/* Privacy Note */}
        <div className="mt-8 pt-6 border-t border-stone-100 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-stone-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict User Data Isolation</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
            Your journals, reflections, and goals are stored exclusively in your own private Firestore path and are never shared or accessible to other users.
          </p>
        </div>
      </div>
    </div>
  );
};
