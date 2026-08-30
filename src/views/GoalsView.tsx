import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { 
  fetchUserGoals, 
  saveUserGoal, 
  updateGoalProgress, 
  deleteUserGoal,
  recordJourneyMilestone
} from '../lib/firebase';
import { GoalItem, GoalTask } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../lib/utils';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Clock, 
  Tag, 
  Sparkles, 
  ChevronRight,
  ListTodo,
  Trophy,
  Calendar
} from 'lucide-react';

interface GoalsViewProps {
  initialDraft?: any;
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ initialDraft, navigate, onShowToast }) => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal / Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('career');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newTasks, setNewTasks] = useState<string[]>(['', '']);
  const [deleteTargetGoalId, setDeleteTargetGoalId] = useState<string | null>(null);

  // Quick inline add task state
  const [inlineTaskInputs, setInlineTaskInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    loadGoals();
  }, [user]);

  // Handle draft from reflection conversion if provided
  useEffect(() => {
    if (initialDraft) {
      setNewTitle(initialDraft.goalTitle || '');
      setNewDesc(initialDraft.description || '');
      setNewCategory(initialDraft.category || 'career');
      if (Array.isArray(initialDraft.tasks) && initialDraft.tasks.length > 0) {
        setNewTasks(initialDraft.tasks);
      }
      setIsCreating(true);
    }
  }, [initialDraft]);

  const loadGoals = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetched = await fetchUserGoals(user.uid);
      setGoals(fetched);
    } catch (err) {
      console.error('Error fetching goals:', err);
      onShowToast('error', 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) {
      onShowToast('error', 'Please provide a goal title.');
      return;
    }

    const filteredTasks: GoalTask[] = newTasks
      .filter((t) => t.trim())
      .map((t, idx) => ({
        id: `task_${Date.now()}_${idx}`,
        text: t.trim(),
        completed: false,
      }));

    try {
      await saveUserGoal(user.uid, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        targetDate: newTargetDate || undefined,
        progress: 0,
        status: 'active',
        tasks: filteredTasks,
      });

      // Reset form
      setNewTitle('');
      setNewDesc('');
      setNewTasks(['', '']);
      setNewTargetDate('');
      setIsCreating(false);

      onShowToast('success', 'Smart Goal created successfully!', 'Goal Established');
      loadGoals();
    } catch (err) {
      console.error('Create goal error:', err);
      onShowToast('error', 'Failed to create goal.');
    }
  };

  const handleToggleTask = async (goal: GoalItem, taskToToggle: GoalTask) => {
    if (!user || !goal.id) return;

    const updatedTasks = goal.tasks.map((t) => {
      if (t.id === taskToToggle.id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      }
      return t;
    });

    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const nextProgress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    const isNowFinished = nextProgress === 100 && goal.progress !== 100;

    // Optimistic UI update
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? {
              ...g,
              tasks: updatedTasks,
              progress: nextProgress,
              status: nextProgress === 100 ? 'completed' : 'active',
            }
          : g
      )
    );

    try {
      await updateGoalProgress(user.uid, goal.id, updatedTasks);

      if (isNowFinished) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onShowToast('success', `🎉 You completed all tasks for "${goal.title}"!`, 'Goal Completed');

        // Record milestone on timeline
        await recordJourneyMilestone(user.uid, {
          type: 'action_completed',
          title: `Completed Goal: ${goal.title}`,
          description: `Checked off all ${updatedTasks.length} action items. Great momentum!`,
          date: new Date().toISOString().slice(0, 10),
          timestamp: Date.now(),
          relatedId: goal.id,
          tag: goal.category || 'goals',
        });
      }
    } catch (err) {
      console.error('Error updating task progress:', err);
      onShowToast('error', 'Failed to update task.');
      loadGoals();
    }
  };

  const handleAddInlineTask = async (goal: GoalItem) => {
    if (!user || !goal.id) return;
    const text = (inlineTaskInputs[goal.id] || '').trim();
    if (!text) return;

    const newTask: GoalTask = {
      id: `task_${Date.now()}`,
      text,
      completed: false,
    };

    const updatedTasks = [...goal.tasks, newTask];
    setInlineTaskInputs({ ...inlineTaskInputs, [goal.id]: '' });

    try {
      await updateGoalProgress(user.uid, goal.id, updatedTasks);
      setGoals(goals.map((g) => (g.id === goal.id ? { ...g, tasks: updatedTasks } : g)));
      onShowToast('success', 'Task added to goal.');
    } catch (err) {
      onShowToast('error', 'Failed to add task.');
    }
  };

  const handleDeleteTask = async (goal: GoalItem, taskId: string) => {
    if (!user || !goal.id) return;
    const updatedTasks = goal.tasks.filter((t) => t.id !== taskId);

    try {
      await updateGoalProgress(user.uid, goal.id, updatedTasks);
      setGoals(goals.map((g) => (g.id === goal.id ? { ...g, tasks: updatedTasks } : g)));
      onShowToast('info', 'Task removed.');
    } catch (err) {
      onShowToast('error', 'Failed to delete task.');
    }
  };

  const handleDeleteGoal = async () => {
    if (!user || !deleteTargetGoalId) return;
    try {
      await deleteUserGoal(user.uid, deleteTargetGoalId);
      setGoals(goals.filter((g) => g.id !== deleteTargetGoalId));
      setDeleteTargetGoalId(null);
      onShowToast('success', 'Goal deleted.');
    } catch (err) {
      onShowToast('error', 'Failed to delete goal.');
    }
  };

  const totalTasks = goals.reduce((acc, g) => acc + g.tasks.length, 0);
  const completedTasks = goals.reduce((acc, g) => acc + g.tasks.filter((t) => t.completed).length, 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-stone-900" />
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
              Smart Goals & Action Items
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Turn your reflections and journal insights into tangible progress.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-3 gap-4 bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
        <div className="text-center border-r border-stone-100 pr-2">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Goals</p>
          <p className="font-serif font-bold text-xl sm:text-2xl text-stone-900 mt-0.5">
            {goals.filter((g) => g.status === 'active').length}
          </p>
        </div>
        <div className="text-center border-r border-stone-100 pr-2">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Action Items</p>
          <p className="font-serif font-bold text-xl sm:text-2xl text-stone-900 mt-0.5">
            {completedTasks} / {totalTasks}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Completed Goals</p>
          <p className="font-serif font-bold text-xl sm:text-2xl text-emerald-700 mt-0.5">
            {goals.filter((g) => g.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Create New Goal Modal / Accordion */}
      {isCreating && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Establish a New Smart Goal
            </h2>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Master Gemini 2.5 API Integrations & Build 3 Apps"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:border-stone-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden"
                >
                  <option value="career">Career & Projects</option>
                  <option value="learning">Learning & Skills</option>
                  <option value="wellness">Wellness & Mindfulness</option>
                  <option value="personal">Personal Growth</option>
                  <option value="creativity">Creativity & Writing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Why does this goal matter right now? What does completion unlock?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden"
              />
            </div>

            {/* Sub-tasks input builder */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-2">
                Actionable Tasks
              </label>
              <div className="space-y-2">
                {newTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`Task ${idx + 1}...`}
                      value={task}
                      onChange={(e) => {
                        const updated = [...newTasks];
                        updated[idx] = e.target.value;
                        setNewTasks(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                    {newTasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewTasks(newTasks.filter((_, i) => i !== idx))}
                        className="p-1.5 text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setNewTasks([...newTasks, ''])}
                  className="text-xs text-amber-800 font-semibold flex items-center gap-1 mt-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another task</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Cards List */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-stone-500 text-xs">Loading goals...</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const isFinished = goal.progress === 100;
            return (
              <div
                key={goal.id}
                className={`bg-white rounded-3xl border p-6 shadow-2xs transition-all ${
                  isFinished
                    ? 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/20 to-white'
                    : 'border-stone-200'
                }`}
              >
                {/* Top Goal Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-md text-[11px] font-semibold uppercase tracking-wider">
                        {goal.category || 'Goal'}
                      </span>
                      {goal.targetDate && (
                        <span className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          Target: {goal.targetDate}
                        </span>
                      )}
                      {isFinished && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-emerald-600" />
                          Completed
                        </span>
                      )}
                    </div>

                    <h3 className={`font-serif font-bold text-lg text-stone-900 ${isFinished ? 'text-stone-700' : ''}`}>
                      {goal.title}
                    </h3>

                    {goal.description && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-serif font-bold text-base text-stone-900">
                        {goal.progress}%
                      </span>
                      <p className="text-[10px] text-stone-500">
                        {goal.tasks.filter((t) => t.completed).length} of {goal.tasks.length} tasks
                      </p>
                    </div>

                    <button
                      onClick={() => setDeleteTargetGoalId(goal.id || null)}
                      className="p-2 text-stone-300 hover:text-rose-600 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinished ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                {/* Tasks List */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Action Tasks
                  </p>

                  {goal.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(goal, task)}
                      className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200/60 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-300 group-hover:text-amber-600 shrink-0" />
                        )}
                        <span
                          className={`text-xs sm:text-sm ${
                            task.completed
                              ? 'line-through text-stone-400 font-light'
                              : 'text-stone-800'
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(goal, task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-600 transition-opacity"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Inline quick task adder */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add an actionable next step..."
                      value={inlineTaskInputs[goal.id!] || ''}
                      onChange={(e) =>
                        setInlineTaskInputs({
                          ...inlineTaskInputs,
                          [goal.id!]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddInlineTask(goal);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-hidden"
                    />
                    <button
                      onClick={() => handleAddInlineTask(goal)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center">
          <Target className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-800 text-base">
            No active goals yet
          </h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            Establish your first SMART goal or convert a reflection card directly into trackable milestones.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Create First Goal
          </button>
        </div>
      )}

      {/* Delete Goal Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetGoalId}
        title="Delete Goal?"
        message="Are you sure you want to delete this goal and its action items? This cannot be undone."
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeleteTargetGoalId(null)}
      />
    </div>
  );
};
