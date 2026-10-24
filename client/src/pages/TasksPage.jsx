import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Tag,
  Loader2,
  X,
  AlertCircle,
  Edit3,
  Trash2,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const CATEGORIES = [
  'All',
  'Freelance Coding',
  'Office Work',
  'Delivery Assignments',
  'Education',
  'Personal Errands & Shopping',
];

const DEADLINE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 Days', days: 3 },
  { label: 'In 5 Days', days: 5 },
  { label: 'In 1 Week', days: 7 },
];

export const TasksPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Auto-open modal if navigated from TopBar New Task button
  useEffect(() => {
    if (location.state?.openNew) {
      setIsCreateOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.openNew]);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Freelance Coding');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newMinutes, setNewMinutes] = useState(45);
  const [newDueDays, setNewDueDays] = useState(0); // 0 = today
  const [newCustomDate, setNewCustomDate] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Freelance Coding');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editMinutes, setEditMinutes] = useState(45);
  const [editDueDays, setEditDueDays] = useState(null);
  const [editCustomDate, setEditCustomDate] = useState('');

  // Fast response query
  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks', selectedCategory, searchTerm],
    queryFn: async () => {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const res = await apiClient.getTasks(params);
      return res.data || [];
    },
    staleTime: 1000 * 15,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
    queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
  };

  // Create Task Mutation
  const createMutation = useMutation({
    mutationFn: (taskData) => apiClient.createTask(taskData),
    onSuccess: () => {
      invalidateAll();
      setIsCreateOpen(false);
      resetCreateForm();
    },
  });

  // Edit Task Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateTask(id, data),
    onSuccess: () => {
      invalidateAll();
      setEditingTask(null);
    },
  });

  // Delete Task Mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, permanent }) => apiClient.deleteTask(id, permanent),
    onSuccess: () => {
      invalidateAll();
      setTaskToDelete(null);
    },
  });

  // Complete Task Mutation
  const completeMutation = useMutation({
    mutationFn: (id) => apiClient.completeTask(id),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const resetCreateForm = () => {
    setNewTitle('');
    setNewCategory('Freelance Coding');
    setNewPriority('Medium');
    setNewMinutes(45);
    setNewDueDays(0);
    setNewCustomDate('');
  };

  const calculateDueDate = (days, customDate) => {
    if (customDate) {
      const d = new Date(customDate);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (days !== null && days !== undefined) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      target.setHours(18, 0, 0, 0); // Default to 6 PM on the target day
      return target.toISOString();
    }
    return null;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const dueAt = calculateDueDate(newDueDays, newCustomDate);

    createMutation.mutate({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      estimatedMinutes: Number(newMinutes),
      dueAt,
      status: 'todo',
      subtasks: [],
    });
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category || 'Freelance Coding');
    setEditPriority(task.priority || 'Medium');
    setEditMinutes(task.estimatedMinutes || 45);
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
        estimatedMinutes: Number(editMinutes),
        dueAt,
      },
    });
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
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

  const formatDeadlineBadge = (dueAt) => {
    if (!dueAt) return null;
    const now = new Date();
    const due = new Date(dueAt);
    const diffHours = (due - now) / 3600000;
    const diffDays = Math.ceil(diffHours / 24);

    if (diffHours < 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue
        </span>
      );
    }
    if (diffDays <= 0 || (now.toDateString() === due.toDateString())) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-400" /> Due Today
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
          <Calendar className="w-3 h-3 text-yellow-300" /> Due Tomorrow
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
        <Calendar className="w-3 h-3 text-blue-400" /> Due in {diffDays} days
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              MongoDB Atlas Live
            </span>
            <span className="text-xs text-slate-400">Database: AiTaksManagemt</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Dynamic Task Manager</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full create, edit, delete, and multi-day deadline management persisted directly to MongoDB Atlas
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or keyword..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
            <p className="text-xs">Loading tasks from Atlas...</p>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="text-center py-10 text-rose-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Failed to fetch tasks from server.</p>
              <p className="text-xs text-slate-400 mt-1">Please ensure backend server on port 5005 is active.</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-200">No active tasks match criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Create your first task or adjust your search filter.</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task._id} className="hover:border-slate-700 transition-colors">
              <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate(task._id)}
                    className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-600 hover:border-blue-400'
                    }`}
                    title="Mark Completed"
                  >
                    {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold transition-colors break-words ${
                        task.status === 'completed'
                          ? 'text-slate-500 line-through'
                          : 'text-slate-100 hover:text-blue-400'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{task.category}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{task.estimatedMinutes} mins</span>
                      </span>
                      {formatDeadlineBadge(task.dueAt)}
                      {task.subtasks?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400/90 font-medium">
                            {task.subtasks.filter((s) => s.status === 'completed').length} of {task.subtasks.length} subtasks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 self-stretch sm:self-center justify-end">
                  <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>

                  {/* Edit Task Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 p-1.5 sm:p-2 h-8 w-8"
                    onClick={() => openEditModal(task)}
                    title="Edit Task"
                  >
                    <Edit3 className="w-4 h-4" />
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100">Create New Task</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Deliver customer order or fix client login"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Freelance Coding">Freelance Coding</option>
                    <option value="Office Work">Office Work</option>
                    <option value="Delivery Assignments">Delivery Assignments</option>
                    <option value="Education">Education</option>
                    <option value="Personal Errands & Shopping">Personal Errands</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Deadline & Multi-Day Presets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Deadline / Due Date (Multi-Day Support)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEADLINE_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setNewDueDays(p.days);
                        setNewCustomDate('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        newDueDays === p.days && !newCustomDate
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {p.label} ({p.days === 0 ? 'Today' : `${p.days}d`})
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">Or choose custom date &amp; time:</label>
                  <input
                    type="datetime-local"
                    value={newCustomDate}
                    onChange={(e) => {
                      setNewCustomDate(e.target.value);
                      setNewDueDays(null);
                    }}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending || !newTitle.trim()}>
                  {createMutation.isPending ? 'Saving to Atlas...' : 'Save Task to Atlas'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold text-slate-100">Edit Task</h3>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
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
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Freelance Coding">Freelance Coding</option>
                    <option value="Office Work">Office Work</option>
                    <option value="Delivery Assignments">Delivery Assignments</option>
                    <option value="Education">Education</option>
                    <option value="Personal Errands & Shopping">Personal Errands</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Deadline & Multi-Day Presets for Edit */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Change Deadline (Multi-Day Options)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEADLINE_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => {
                        setEditDueDays(p.days);
                        setEditCustomDate('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        editDueDays === p.days
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {p.label} ({p.days === 0 ? 'Today' : `${p.days}d`})
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">Or custom date &amp; time:</label>
                  <input
                    type="datetime-local"
                    value={editCustomDate}
                    onChange={(e) => {
                      setEditCustomDate(e.target.value);
                      setEditDueDays(null);
                    }}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={editMutation.isPending || !editTitle.trim()}>
                  {editMutation.isPending ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-semibold text-slate-100">Delete Task</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <strong className="text-white">"{taskToDelete.title}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setTaskToDelete(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-500 text-white"
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
