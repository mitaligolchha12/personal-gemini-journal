import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Brain, 
  Target, 
  Compass, 
  BookOpen, 
  Search, 
  Layers, 
  CheckCircle2, 
  Flame,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { user, loginWithGoogle } = useAuth();

  const handlePrimaryCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const featureCards = [
    {
      icon: '✍️',
      title: 'Private Journaling',
      description: 'A distraction-free, mindful canvas to log your thoughts, moods, and life chapters with instant local auto-recovery.',
    },
    {
      icon: '🤖',
      title: 'Gemini Conversations',
      description: 'Engage in multi-turn reflective dialogue with Gemini grounded in your current journal entry context.',
    },
    {
      icon: '🪞',
      title: 'AI Reflection Cards',
      description: 'Receive thoughtful perspective shifts, non-clinical observations, and guided thinking questions.',
    },
    {
      icon: '🔎',
      title: 'Pattern Discovery',
      description: 'Uncover recurring curiosities, life themes, and subtle shifts across your personal entries over time.',
    },
    {
      icon: '🎯',
      title: 'Smart Goals & Action Items',
      description: 'Transform fleeting realizations into practical, bite-sized tasks and trackable SMART goals in one click.',
    },
    {
      icon: '📈',
      title: 'Personal Journey Timeline',
      description: 'View an interactive, chronological narrative connecting your reflections, milestones, and achievements.',
    },
    {
      icon: '🔒',
      title: 'Strict User Isolation',
      description: 'Built with Firebase Authentication, zero-insecure Firestore rules, and server-side Secret Manager credential protection.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50/20 to-stone-100/50 flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Subtle decorative background shapes */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-200/20 to-indigo-200/20 blur-3xl -z-10 rounded-full" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/70 text-amber-900 text-xs font-semibold shadow-2xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Built for Google Cloud Run & AI Studio Challenge</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl text-stone-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Turn your thoughts into reflection, goals, and growth.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-light">
            Write freely, reflect deeply, discover patterns, and turn your thoughts into meaningful action with Gemini.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-primary-cta"
              onClick={handlePrimaryCTA}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-base font-medium shadow-md hover:shadow-lg transition-all transform active:scale-98"
            >
              <span>{user ? 'Go to Dashboard' : 'Continue with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/80 hover:bg-white border border-stone-300 text-stone-700 rounded-xl text-base font-medium shadow-xs hover:shadow-sm transition-all"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Strict Owner-Bound Privacy
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-600" />
              Firebase Auth & Firestore Rules
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Multi-turn Gemini 2.5/3.6 Ladder
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Flow Loop Card */}
      <section className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <p className="text-center text-xs font-semibold tracking-wider text-amber-800 uppercase mb-6">
            The Transformative AI Reflection Loop
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {[
              { step: '1', title: 'Write', desc: 'Raw thoughts & feelings', emoji: '✍️' },
              { step: '2', title: 'Reflect', desc: 'AI perspective & questions', emoji: '🪞' },
              { step: '3', title: 'Patterns', desc: 'Uncover recurring themes', emoji: '🔎' },
              { step: '4', title: 'Goals', desc: 'Convert thoughts to SMART goals', emoji: '🎯' },
              { step: '5', title: 'Action', desc: 'Execute bite-sized tasks', emoji: '⚡' },
              { step: '6', title: 'Grow', desc: 'Track visual journey timeline', emoji: '📈' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-stone-50/70 border border-stone-200/60 rounded-2xl flex flex-col items-center">
                <span className="text-2xl mb-2">{item.emoji}</span>
                <span className="text-xs font-bold text-stone-900">{item.title}</span>
                <span className="text-[11px] text-stone-500 mt-1 leading-tight">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl text-stone-900">
            More than a chatbot. A personal growth workspace.
          </h2>
          <p className="text-stone-600 text-sm mt-2 max-w-xl mx-auto">
            Experience purposeful AI reflection tailored specifically to guide you toward clarity and meaningful progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all flex flex-col"
            >
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="font-serif font-bold text-lg text-stone-900 mb-2">
                {feat.title}
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works breakdown */}
      <section id="how-it-works" className="py-16 bg-stone-100/60 border-y border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif font-bold text-3xl text-stone-900">
              How Personal Gemini Journal Works
            </h2>
            <p className="text-stone-600 text-sm mt-2">
              From raw thought to verified achievement in three straightforward stages.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Write Your Daily Stream of Consciousness
                </h4>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 leading-relaxed">
                  Log your challenges, project milestones, questions, and emotional state. Your entries remain strictly private and encrypted in Firestore under owner-bound authorization.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Reflect, Unpack, & Chat with Gemini
                </h4>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 leading-relaxed">
                  Click 🪞 Reflect for your instant reflection card, summarize key ideas, brainstorm alternative viewpoints, and ask Gemini clarifying questions in a multi-turn conversation.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-stone-900">
                  Convert Insights to Goals & Track Your Journey
                </h4>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 leading-relaxed">
                  Turn reflections directly into trackable SMART goals and actionable tasks. As you check off items, your personal timeline narrative builds automatically on My Journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-white border-t border-stone-200 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-stone-800">Personal Gemini Journal</span>
            <span>— AI Reflection & Growth Workspace</span>
          </div>
          <div className="text-[11px] text-stone-500">
            Powered by Google AI Studio, Gemini API, Firebase & Cloud Run.
          </div>
        </div>
      </footer>
    </div>
  );
};
