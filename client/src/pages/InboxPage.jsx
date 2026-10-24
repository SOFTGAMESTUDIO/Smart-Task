import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Inbox,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Loader2,
  Tag,
  Clock,
  Calendar,
  Search,
  Filter,
  Check,
  Edit3,
  X,
  AlertTriangle,
  Flame,
  CheckCircle,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const CATEGORIES = [
  'Personal Errands & Shopping',
  'Freelance Coding',
  'Office Work',
  'Delivery Assignments',
  'Education',
];

const DEADLINE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 Days', days: 3 },
  { label: 'In 5 Days', days: 5 },
  { label: 'In 1 Week', days: 7 },
];

const DURATION_PRESETS = [15, 30, 45, 60];

const SAMPLE_IDEAS = [
  { text: 'Review pull request and merge staging build', cat: 'Freelance Coding', days: 1 },
  { text: 'Renew car insurance and vehicle registration', cat: 'Personal Errands & Shopping', days: 3 },
  { text: 'Submit quarterly budget analysis to finance team', cat: 'Office Work', days: 5 },
];

export const InboxPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Quick Capture State
  const [taskText, setTaskText] = useState('');
  const [category, setCategory] = useState('Personal Errands & Shopping');
  const [priority, setPriority] = useState('Medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [dueDays, setDueDays] = useState(0); // Default: Today
  const [customDate, setCustomDate] = useState('');
  const [showAdvancedCapture, setShowAdvancedCapture] = useState(false);

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, priority, due

  // Modal States
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Personal Errands & Shopping');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editMinutes, setEditMinutes] = useState(30);
  const [editDueDays, setEditDueDays] = useState(null);
  const [editCustomDate, setEditCustomDate] = useState('');

  const [taskToDelete, setTaskToDelete] = useState(null);

  // Load live tasks from backend that are in 'todo' status
  const { data: allTasks = [], isLoading, isError } = useQuery({
    queryKey: ['inbox-tasks'],
    queryFn: async () => {
      const res = await apiClient.getTasks({ status: 'todo' });
      return res.data || [];
    },
    staleTime: 1000 * 15,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
  };

  const calculateDueDate = (days, customDateTime) => {
    if (customDateTime) {
      const d = new Date(customDateTime);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (days !== null && days !== undefined) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      target.setHours(18, 0, 0, 0); // Default to 6:00 PM target
      return target.toISOString();
    }
    return null;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createTask(data),
    onSuccess: () => {
      invalidateAll();
      setTaskText('');
      setCustomDate('');
      setDueDays(0);
      setShowAdvancedCapture(false);
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateTask(id, data),
    onSuccess: () => {
      invalidateAll();
      setEditingTask(null);
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id) => apiClient.completeTask(id),
    onSuccess: () => {
      invalidateAll();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, permanent }) => apiClient.deleteTask(id, permanent),
    onSuccess: () => {
      invalidateAll();
      setTaskToDelete(null);
    },
  });

  const handleCaptureSubmit = (e) => {
    e?.preventDefault();
    if (!taskText.trim()) return;

    const dueAt = calculateDueDate(dueDays, customDate);

    createMutation.mutate({
      title: taskText.trim(),
      category,
      priority,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      dueAt,
      status: 'todo',
      subtasks: [],
    });
  };

  const handleDecomposeInAI = (text) => {
    navigate('/ai-planner', { state: { initialInput: text } });
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || '');
    setEditCategory(task.category || 'Personal Errands & Shopping');
    setEditPriority(task.priority || 'Medium');
    setEditMinutes(task.estimatedMinutes || 30);
    setEditDueDays(null);
    setEditCustomDate(task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    let dueAt = editingTask.dueAt;
    if (editDueDays !== null) {
      dueAt = calculateDueDate(editDueDays, null);
    } else if (editCustomDate) {
      dueAt = calculateDueDate(null, editCustomDate);
    }

    editMutation.mutate({
      id: editingTask._id,
      data: {
        title: editTitle.trim(),
        category: editCategory,
        priority: editPriority,
        estimatedMinutes: Number(editMinutes) || 30,
        dueAt,
      },
    });
  };

  // Metrics computation for summary bar
  const stats = useMemo(() => {
    const total = allTasks.length;
    const highPriority = allTasks.filter((t) => t.priority === 'High' || t.priority === 'Critical').length;
    const totalMinutes = allTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const now = new Date();
    const dueTodayOrOverdue = allTasks.filter((t) => {
      if (!t.dueAt) return false;
      const d = new Date(t.dueAt);
      return d <= now || d.toDateString() === now.toDateString();
    }).length;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationLabel = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

    return { total, highPriority, durationLabel, dueTodayOrOverdue };
  }, [allTasks]);

  // Filter & Sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    return allTasks
      .filter((task) => {
        const matchesSearch =
          !searchTerm ||
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || task.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'priority') {
          const map = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (map[b.priority] || 2) - (map[a.priority] || 2);
        }
        if (sortBy === 'due') {
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt) - new Date(b.dueAt);
        }
        return 0;
      });
  }, [allTasks, searchTerm, filterCategory, sortBy]);

  const getPriorityBadgeVariant = (p) => {
    switch (p) {
      case 'Critical':
        return 'danger';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDeadline = (dueAt) => {
    if (!dueAt) return null;
    const now = new Date();
    const due = new Date(dueAt);
    const diffHours = (due - now) / 3600000;
    const diffDays = Math.ceil(diffHours / 24);

    if (diffHours < 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
          <span>Overdue</span>
        </span>
      );
    }
    if (diffDays <= 0 || now.toDateString() === due.toDateString()) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Due Today</span>
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
          <Calendar className="w-3 h-3 text-yellow-300 shrink-0" />
          <span>Due Tomorrow</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
        <Calendar className="w-3 h-3 text-blue-400 shrink-0" />
        <span>Due in {diffDays}d</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <Badge variant="indigo" className="text-[11px] sm:text-xs">
              Universal Inbox
            </Badge>
            <span className="text-[11px] sm:text-xs text-slate-400">Zero-Friction Thought Collector</span>
            <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Atlas Live
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Universal Capture Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Capture commitments, tasks, and ideas before you forget. Schedule multi-day deadlines or send to AI Planner for atomic breakdown.
          </p>
        </div>

        {/* Total Item Count Chip */}
        <div className="self-start sm:self-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200">
            <Inbox className="w-4 h-4 text-blue-400" />
            <span>{allTasks.length} {allTasks.length === 1 ? 'task' : 'tasks'}</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar (Fully responsive 2-col on mobile, 4-col on tablet/desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Pending Inbox</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg sm:text-xl font-bold text-slate-100">{stats.total}</span>
            <Inbox className="w-4 h-4 text-blue-400 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">High / Critical</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg sm:text-xl font-bold text-amber-400">{stats.highPriority}</span>
            <Flame className="w-4 h-4 text-amber-400 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Due Today / Soon</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg sm:text-xl font-bold text-yellow-300">{stats.dueTodayOrOverdue}</span>
            <Calendar className="w-4 h-4 text-yellow-300 opacity-80" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Total Workload</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg sm:text-xl font-bold text-slate-200">{stats.durationLabel}</span>
            <Clock className="w-4 h-4 text-slate-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Universal Quick Capture Card (Optimized for all devices) */}
      <Card elevated className="border-blue-500/30 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 shadow-xl overflow-hidden">
        <CardContent className="p-3.5 sm:p-5 space-y-3.5">
          <form onSubmit={handleCaptureSubmit} className="space-y-3">
            {/* Input Row */}
            <div className="relative">
              <input
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="Capture any thought (e.g. 'Fix login token bug' or 'Renew car insurance')..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-3.5 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner"
              />
              {taskText && (
                <button
                  type="button"
                  onClick={() => setTaskText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Multi-Day Deadline Presets Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Quick Deadline:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdvancedCapture(!showAdvancedCapture)}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{showAdvancedCapture ? 'Hide details' : 'More options'}</span>
                </button>
              </div>

              {/* Deadline Preset Chips (Horizontally scrollable on mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {DEADLINE_PRESETS.map((p) => {
                  const isSelected = dueDays === p.days && !customDate;
                  return (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setDueDays(p.days);
                        setCustomDate('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="text-[10px] opacity-75">({p.days === 0 ? 'Today' : `+${p.days}d`})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expandable Advanced Options (Category, Priority, Duration, Custom Date) */}
            {showAdvancedCapture && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Category */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Estimate (Minutes)</label>
                    <div className="flex items-center gap-1">
                      {DURATION_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setEstimatedMinutes(mins)}
                          className={`flex-1 py-1.5 rounded text-center font-medium transition-colors ${
                            estimatedMinutes === mins
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Date Input */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Custom Exact Date & Time (optional)</label>
                  <input
                    type="datetime-local"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDueDays(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-none text-slate-300">
                  {category}
                </span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{estimatedMinutes}m</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="submit"
                  disabled={!taskText.trim() || createMutation.isPending}
                  className="w-full sm:w-auto justify-center px-4 py-2 text-xs font-semibold h-10 sm:h-9"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Capture to Inbox</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Intelligent AI Planner Bridge Banner (When user enters rich text) */}
          {taskText.trim().length >= 6 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                <span>Multi-step project? Let Qwen 2.5 Coder break this down:</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-blue-400 border-blue-500/40 hover:bg-blue-500/10 justify-center w-full sm:w-auto h-9"
                onClick={() => handleDecomposeInAI(taskText.trim())}
              >
                <span>Send to AI Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter, Search & Sort Toolbar (Responsive on mobile & desktop) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search thoughts, errands, or coding tasks..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
              <option value="due">Due Soonest</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filterCategory === 'All'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {allTasks.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = allTasks.filter((t) => t.category === cat).length;
            const shortName = cat.replace('Personal Errands & Shopping', 'Personal').replace('Delivery Assignments', 'Delivery');
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{shortName}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inbox Task List (Responsive on all screen widths) */}
      <div className="space-y-2.5 sm:space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
              <p className="text-xs sm:text-sm">Fetching live inbox items from MongoDB Atlas...</p>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-rose-500/30">
            <CardContent className="py-10 text-center text-rose-400 space-y-1">
              <p className="text-sm font-semibold">Failed to fetch inbox items from server.</p>
              <p className="text-xs text-slate-500">Please ensure backend server on port 5005 is active.</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedTasks.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-200">
                  {allTasks.length === 0 ? 'Your Universal Inbox is clear!' : 'No tasks match your filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {allTasks.length === 0
                    ? 'Get tasks out of your head. Type anything in the capture box above or pick a sample idea below:'
                    : 'Try clearing your search query or switching your category filter.'}
                </p>
              </div>

              {allTasks.length === 0 && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
                  {SAMPLE_IDEAS.map((idea, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTaskText(idea.text);
                        setCategory(idea.cat);
                        setDueDays(idea.days);
                      }}
                      className="w-full sm:w-auto text-left sm:text-center text-[11px] p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-blue-300 transition-colors"
                    >
                      💡 {idea.text}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedTasks.map((task) => (
            <Card
              key={task._id}
              className="hover:border-slate-700/80 transition-all duration-150 bg-slate-900/60 shadow-sm"
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Top / Left: Checkbox + Title + Meta */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Responsive Checkbox (Large comfortable touch area on mobile) */}
                    <button
                      type="button"
                      onClick={() => completeMutation.mutate(task._id)}
                      className="w-6 h-6 mt-0.5 rounded-full border-2 border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center transition-all shrink-0 group"
                      title="Mark task completed"
                    >
                      <Check className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-400 transition-colors" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-slate-100 hover:text-blue-400 transition-colors break-words">
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-[10px] px-1.5 py-0">
                          {task.priority || 'Medium'}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                      )}

                      {/* Task Metadata Row */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 flex-wrap">
                        {/* Category */}
                        <span className="flex items-center gap-1 text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                          <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-none">{task.category}</span>
                        </span>

                        {/* Estimated Time */}
                        <span className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{task.estimatedMinutes || 30}m</span>
                        </span>

                        {/* Deadline Indicator */}
                        {formatDeadline(task.dueAt)}

                        {/* Subtasks Count (if any) */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right / Bottom Action Bar (Adapts on mobile into ergonomic horizontal buttons) */}
                  <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 self-stretch sm:self-center">
                    {/* AI Decompose Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs px-2.5 sm:px-3 py-1.5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 flex-1 sm:flex-initial justify-center h-8"
                      onClick={() =>
                        handleDecomposeInAI(
                          task.title + (task.description ? ` - ${task.description}` : '')
                        )
                      }
                      title="Decompose into subtasks with Qwen 2.5 Coder"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>AI Decompose</span>
                    </Button>

                    {/* Edit Task Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 p-1.5 sm:p-2 h-8 w-8"
                      onClick={() => openEditModal(task)}
                      title="Edit Task & Deadline"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    {/* Complete Task Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-1.5 sm:p-2 h-8 w-8"
                      onClick={() => completeMutation.mutate(task._id)}
                      title="Mark as Done"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>

                    {/* Delete Task Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 sm:p-2 h-8 w-8"
                      onClick={() => setTaskToDelete(task)}
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Task Modal (Fully Responsive on Mobile & Desktop) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100">Edit Inbox Task</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Estimated Duration (mins)</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Multi-Day Deadline Editor */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Deadline / Due Date (Multi-Day Presets)
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {DEADLINE_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setEditDueDays(p.days);
                        setEditCustomDate('');
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        editDueDays === p.days && !editCustomDate
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {p.label} ({p.days === 0 ? 'Today' : `+${p.days}d`})
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">Or choose custom date & time:</label>
                  <input
                    type="datetime-local"
                    value={editCustomDate}
                    onChange={(e) => {
                      setEditCustomDate(e.target.value);
                      setEditDueDays(null);
                    }}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editMutation.isPending || !editTitle.trim()}
                >
                  {editMutation.isPending ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Responsive) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">Delete Task</h3>
                <p className="text-xs text-slate-400">Remove from Universal Inbox</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300">
              Are you sure you want to remove <span className="font-semibold text-white">"{taskToDelete.title}"</span>?
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTaskToDelete(null)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-amber-400 border-amber-500/40 hover:bg-amber-500/10 w-full sm:w-auto"
                onClick={() => deleteMutation.mutate({ id: taskToDelete._id, permanent: false })}
                disabled={deleteMutation.isPending}
              >
                Cancel / Archive
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => deleteMutation.mutate({ id: taskToDelete._id, permanent: true })}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxPage;
