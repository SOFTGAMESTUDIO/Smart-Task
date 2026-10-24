import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Check,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  CheckCircle2,
  Edit3,
  Calendar,
  Layers,
  ChevronRight,
  CheckCheck,
  ListTodo,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { apiClient } from '../services/apiClient';

const PRIORITY_VARIANTS = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'primary',
  Low: 'default',
};

const SAMPLE_PROMPTS = [
  'Task 1 deliver customer order packages today by 5 PM, and task 2 fix client login auth bug within 5 days',
  'Prepare marketing proposal by tomorrow 2 PM, review pull request today, and launch product update in 7 days',
  'Weekly grocery run today 6 PM, oil change in 3 days, and quarterly tax filing in 10 days',
];

export const AIPlannerPage = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder:latest');
  const [taskInput, setTaskInput] = useState(
    location.state?.initialInput ||
      'Task 1 deliver customer order packages today by 5 PM, and task 2 fix the client login authentication bug within 5 days'
  );
  const [decomposedPlan, setDecomposedPlan] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [approvedSet, setApprovedSet] = useState(new Set());
  const [rejectedSet, setRejectedSet] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');

  // AI Status check
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => {
      const res = await apiClient.getAIStatus();
      return res.data || {};
    },
    staleTime: 30000,
    retry: false,
  });

  const ollamaOnline = aiStatus?.ollama === 'connected';
  const availableModels = aiStatus?.models?.length > 0 ? aiStatus.models : ['qwen2.5-coder:latest', 'llama3:8b'];

  // Decompose mutation
  const decomposeMutation = useMutation({
    mutationFn: (description) => apiClient.decomposeTask(description, selectedModel),
    onSuccess: (res) => {
      const plan = res.data;
      setDecomposedPlan(plan);
      setApprovedSet(new Set(plan.subtasks.map((_, i) => i)));
      setRejectedSet(new Set());
      setSuccessMessage('');
    },
  });

  // Approve & save mutation (Human-in-the-Loop directly to MongoDB Atlas)
  const approveMutation = useMutation({
    mutationFn: ({ originalInput, subtasks }) =>
      apiClient.approveDecomposition(originalInput, subtasks),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
      setSuccessMessage(`✅ Successfully persisted ${res.data.length} tasks with distinct deadlines to MongoDB Atlas!`);
      setDecomposedPlan(null);
      setTaskInput('');
    },
  });

  const handleDecompose = () => {
    if (!taskInput.trim() || taskInput.trim().length < 5) return;
    setDecomposedPlan(null);
    setSuccessMessage('');
    decomposeMutation.mutate(taskInput.trim());
  };

  const handleApproveAll = () => {
    if (!decomposedPlan) return;
    const toSave = decomposedPlan.subtasks.filter((_, i) => !rejectedSet.has(i));
    if (toSave.length === 0) return;
    approveMutation.mutate({ originalInput: taskInput, subtasks: toSave });
  };

  const handleRejectAll = () => {
    setDecomposedPlan(null);
    setApprovedSet(new Set());
    setRejectedSet(new Set());
  };

  const toggleSubtask = (idx) => {
    const newApproved = new Set(approvedSet);
    const newRejected = new Set(rejectedSet);
    if (approvedSet.has(idx)) {
      newApproved.delete(idx);
      newRejected.add(idx);
    } else {
      newApproved.add(idx);
      newRejected.delete(idx);
    }
    setApprovedSet(newApproved);
    setRejectedSet(newRejected);
  };

  const updateSubtask = (idx, field, value) => {
    const updated = { ...decomposedPlan };
    updated.subtasks = [...decomposedPlan.subtasks];
    updated.subtasks[idx] = { ...updated.subtasks[idx], [field]: value };
    setDecomposedPlan(updated);
  };

  const approvedCount = approvedSet.size;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <Badge variant="indigo" className="text-[11px] sm:text-xs">
              Qwen 2.5 Coder + Local LLM
            </Badge>
            <span className="text-[11px] sm:text-xs text-slate-400">Strict Human-in-the-Loop Review</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            AI Task Decomposition &amp; Review
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Qwen breaks complex multi-part commitments into atomic tasks with independent deadlines. Review and approve before saving to Atlas.
          </p>
        </div>

        {/* Ollama Connection Status Chip */}
        <div className="self-start sm:self-auto flex items-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              ollamaOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {ollamaOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="truncate max-w-[160px] sm:max-w-none">
              {ollamaOnline ? `Ollama Active (${selectedModel.split(':')[0]})` : 'Ollama Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Ollama offline warning */}
      {!ollamaOnline && (
        <Alert variant="warning" title="Local LLM Offline">
          Ollama is not reachable at <code className="text-amber-300 font-mono">http://localhost:11434</code>. Run{' '}
          <code className="text-amber-300 font-mono">ollama serve</code> in your terminal and refresh.
        </Alert>
      )}

      {/* Success Message */}
      {successMessage && (
        <Alert variant="success" title="Persisted to MongoDB Atlas">
          {successMessage}
        </Alert>
      )}

      {/* Input Area Card (Responsive Form) */}
      <Card elevated className="border-slate-800 bg-slate-900/90 shadow-xl">
        <CardHeader className="p-3.5 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <CardTitle className="text-sm sm:text-base font-semibold text-slate-100">
              Task Input &amp; Commitment Prompt
            </CardTitle>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">Engine:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-blue-300 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m.includes('qwen') ? `⚡ ${m} (Recommended)` : m}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 sm:p-5 space-y-3.5">
          <textarea
            rows={3}
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Type commitments (e.g. 'Task 1 deliver customer order packages today by 5 PM, and task 2 fix the client login auth bug within 5 days')..."
            className="w-full rounded-xl bg-slate-950 border border-slate-700/80 p-3 sm:p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[90px]"
          />

          {/* Sample Prompts for Fast Testing */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-500 block">Or pick a multi-deadline test commitment:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTaskInput(prompt)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 whitespace-nowrap transition-colors flex-shrink-0"
                >
                  Prompt {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              Active model: <strong className="text-slate-200 font-mono">{selectedModel}</strong>
            </span>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {decomposedPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecompose}
                  disabled={decomposeMutation.isPending}
                  className="flex-1 sm:flex-initial justify-center text-xs h-9"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleDecompose}
                disabled={decomposeMutation.isPending || !taskInput.trim() || taskInput.trim().length < 5}
                className="flex-1 sm:flex-initial justify-center text-xs font-semibold h-9"
              >
                {decomposeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Qwen...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze &amp; Decompose</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Decomposition Error Alert */}
      {decomposeMutation.isError && (
        <Alert variant="error" title="AI Decomposition Failed">
          {decomposeMutation.error?.message || 'Could not reach Ollama. Make sure it is running locally.'}
        </Alert>
      )}

      {/* Loading State Skeleton */}
      {decomposeMutation.isPending && (
        <Card elevated className="border-blue-500/30 bg-slate-900/60">
          <CardContent className="py-14 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <Sparkles className="w-4 h-4 text-blue-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-200">Qwen 2.5 Coder is decomposing commitments...</p>
            <p className="text-xs text-slate-400 max-w-md">
              Extracting subtasks, estimating durations, and assigning individual deadlines.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Proposed Decomposition Plan (Responsive Card Stack) */}
      {decomposedPlan && !decomposeMutation.isPending && (
        <Card elevated className="border-slate-700 bg-slate-900/80 shadow-2xl overflow-hidden">
          {/* Header with Review Warnings & Batch Actions */}
          <CardHeader className="p-3.5 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-100">
                  Proposed Decomposition Plan
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">
                  Draft — Review Before Approving
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {decomposedPlan.explanation}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                <span className="text-blue-400 font-medium">Model: {decomposedPlan.model}</span>
                <span>•</span>
                <span>Total Workload: <strong className="text-slate-200">{decomposedPlan.estimatedTotalMinutes} mins</strong></span>
                <span>•</span>
                <span>Subtasks: <strong className="text-emerald-400">{approvedCount} selected</strong></span>
              </div>
            </div>

            {/* Plan Batch Action Buttons */}
            <div className="flex items-center gap-2 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="text-rose-400 hover:text-rose-300 flex-1 md:flex-initial justify-center text-xs h-9"
                onClick={handleRejectAll}
              >
                <X className="w-4 h-4" />
                <span>Reject All</span>
              </Button>

              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 md:flex-initial justify-center text-xs font-semibold h-9"
                onClick={handleApproveAll}
                disabled={approveMutation.isPending || approvedCount === 0}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                <span>Approve &amp; Save ({approvedCount})</span>
              </Button>
            </div>
          </CardHeader>

          {/* Subtask Review Items List */}
          <CardContent className="p-0 divide-y divide-slate-800/80">
            {decomposedPlan.subtasks.map((st, i) => {
              const approved = approvedSet.has(i);
              const editing = editingIdx === i;
              return (
                <div
                  key={st.id || i}
                  className={`p-3.5 sm:p-4.5 transition-colors ${
                    approved ? 'hover:bg-slate-850/40 bg-slate-900/40' : 'opacity-40 bg-slate-950/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Selection Button + Number + Content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox toggle */}
                      <button
                        type="button"
                        onClick={() => toggleSubtask(i)}
                        className={`w-6 h-6 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          approved
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20'
                            : 'border-slate-600 bg-transparent text-transparent hover:border-slate-400'
                        }`}
                        title={approved ? 'Click to deselect' : 'Click to include'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Number badge */}
                      <span className="w-6 h-6 rounded-md bg-slate-800/80 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                        {i + 1}
                      </span>

                      {/* Subtask Body */}
                      <div className="flex-1 min-w-0">
                        {editing ? (
                          <div className="space-y-2.5 p-3 rounded-xl bg-slate-950 border border-slate-700">
                            <div>
                              <label className="text-[11px] text-slate-400 block mb-1">Title</label>
                              <input
                                autoFocus
                                value={st.title}
                                onChange={(e) => updateSubtask(i, 'title', e.target.value)}
                                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
                                <select
                                  value={st.priority}
                                  onChange={(e) => updateSubtask(i, 'priority', e.target.value)}
                                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                >
                                  {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Estimate (mins)</label>
                                <input
                                  type="number"
                                  value={st.estimatedMinutes}
                                  onChange={(e) => updateSubtask(i, 'estimatedMinutes', Number(e.target.value))}
                                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Deadline</label>
                                <input
                                  type="text"
                                  value={st.deadline}
                                  onChange={(e) => updateSubtask(i, 'deadline', e.target.value)}
                                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                                  placeholder="e.g. In 5 days"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <Button size="sm" onClick={() => setEditingIdx(null)} className="text-xs h-8">
                                Done Editing
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm sm:text-base font-semibold text-slate-100 break-words">
                              {st.title}
                            </h4>

                            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                              <span className="text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                                {st.category}
                              </span>

                              <span className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {st.estimatedMinutes}m
                              </span>

                              <span className="flex items-center gap-1 font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                {st.deadline}
                              </span>

                              {st.dependencies && st.dependencies !== 'None' && (
                                <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  Prereq: {st.dependencies}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Priority Badge & Inline Edit trigger */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 self-stretch sm:self-auto">
                      <Badge variant={PRIORITY_VARIANTS[st.priority] || 'default'} className="text-[11px]">
                        {st.priority}
                      </Badge>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingIdx(editing ? null : i)}
                        className="text-xs text-slate-400 hover:text-blue-400 h-8"
                      >
                        {editing ? (
                          'Cancel'
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Edit</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Approve Pending Persistence State */}
      {approveMutation.isPending && (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="py-8 flex items-center justify-center gap-2.5 text-emerald-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs sm:text-sm font-semibold">
              Writing approved tasks directly to MongoDB Atlas collection...
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIPlannerPage;
