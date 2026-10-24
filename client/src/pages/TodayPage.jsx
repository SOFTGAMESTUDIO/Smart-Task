import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
  Check,
  Tag,
  ListTodo,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PRIORITY_BADGES = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'primary',
  Low: 'default',
};

export const TodayPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Focus Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);

  // Fetch today's focus tasks from backend
  const { data: todayTasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['today-tasks'],
    queryFn: async () => {
      const res = await apiClient.getTodayTasks();
      return res.data || [];
    },
    staleTime: 1000 * 30,
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id) => apiClient.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      setTimerActive(false);
    },
  });

  // Calculate stats
  const activeTasks = todayTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');
  const totalScheduledMinutes = activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0);
  const hoursScheduled = Math.floor(totalScheduledMinutes / 60);
  const minsScheduled = totalScheduledMinutes % 60;

  // 8 hour total workday assumed
  const availableMinutes = Math.max(0, 480 - totalScheduledMinutes);
  const hoursAvailable = Math.floor(availableMinutes / 60);
  const minsAvailable = availableMinutes % 60;

  // Hero focus task is the first active task
  const heroTask = activeTasks[0] || null;

  // Sync timer when hero task changes and timer isn't running
  useEffect(() => {
    if (heroTask && (!activeTimerTaskId || activeTimerTaskId !== heroTask._id)) {
      setActiveTimerTaskId(heroTask._id);
      setSecondsRemaining((heroTask.estimatedMinutes || 45) * 60);
      setTimerActive(false);
    }
  }, [heroTask?._id]);

  // Timer countdown tick
  useEffect(() => {
    let interval = null;
    if (timerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsRemaining === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsRemaining]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimerActive(false);
    if (heroTask) {
      setSecondsRemaining((heroTask.estimatedMinutes || 45) * 60);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Today's Focus &amp; Schedule</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic timeline optimized according to hard constraints, deadlines, and working hours
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">
            Available: {hoursAvailable}h {minsAvailable}m
          </Badge>
          <Badge variant="warning">
            Scheduled: {hoursScheduled}h {minsScheduled}m
          </Badge>
          <Badge variant="success">
            Done: {completedTasks.length}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
            <p className="text-xs">Computing priority schedule for today...</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Unable to load today's schedule</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : heroTask ? (
        /* Hero: Active / Next Focus Task */
        <Card elevated className="border-blue-500/30 bg-gradient-to-r from-slate-900 to-blue-950/30 shadow-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Recommended Next Action
                  </span>
                  <Badge variant={PRIORITY_BADGES[heroTask.priority] || 'primary'}>
                    {heroTask.priority}
                  </Badge>
                  {heroTask.recommendationReason && (
                    <span className="text-[11px] text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {heroTask.recommendationReason}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-100">{heroTask.title}</h3>
                {heroTask.description && (
                  <p className="text-xs text-slate-400 max-w-2xl">{heroTask.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Tag className="w-3.5 h-3.5 text-blue-400" /> {heroTask.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> Est. {heroTask.estimatedMinutes} mins
                  </span>
                  {heroTask.dueAt && (
                    <>
                      <span>•</span>
                      <span className="text-rose-400">
                        Due: {new Date(heroTask.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                  {heroTask.subtasks?.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-300">
                        {heroTask.subtasks.filter((s) => s.status === 'completed').length} of {heroTask.subtasks.length} subtasks done
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Focus Timer Widget */}
              <div className="flex flex-col items-center bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto md:min-w-[220px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                  Focus Sprint Timer
                </span>
                <span className={`text-3xl font-mono font-bold tracking-wider ${timerActive ? 'text-blue-400 animate-pulse' : 'text-slate-100'}`}>
                  {formatTimer(secondsRemaining)}
                </span>
                <div className="flex items-center gap-2 mt-3 w-full">
                  <Button
                    size="sm"
                    className={`flex-1 ${timerActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
                    onClick={() => setTimerActive(!timerActive)}
                  >
                    {timerActive ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start</span>
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetTimer} title="Reset Timer">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full mt-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => completeMutation.mutate(heroTask._id)}
                  disabled={completeMutation.isPending}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card elevated className="border-emerald-500/30 bg-emerald-950/10 text-center py-10">
          <CardContent className="space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-100">All Scheduled Tasks for Today Complete!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Great work. You've cleared today's priority commitments. Capture new tasks or use AI Planner to organize your upcoming work.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/tasks')}>
                View All Tasks
              </Button>
              <Button size="sm" onClick={() => navigate('/ai-planner')}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Planner</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Blocks / Remaining List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-400" />
              <CardTitle>Daily Schedule Blocks</CardTitle>
            </div>
            <span className="text-xs text-slate-400">{activeTasks.length} pending • {completedTasks.length} done</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-800">
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No tasks scheduled for today.
            </div>
          ) : (
            <>
              {activeTasks.map((task, idx) => (
                <div
                  key={task._id}
                  className="p-3.5 sm:p-4 hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => completeMutation.mutate(task._id)}
                      className="w-5 h-5 mt-0.5 rounded border border-slate-600 hover:border-emerald-400 flex items-center justify-center transition-colors shrink-0"
                      title="Mark Done"
                    >
                      <Check className="w-3 h-3 text-transparent hover:text-emerald-400" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 shrink-0">
                          #{idx + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-200 break-words">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="truncate max-w-[140px] sm:max-w-none text-slate-300">{task.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{task.estimatedMinutes} mins</span>
                        </span>
                        {task.dueAt && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-medium">
                              Due: {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                        {task.subtasks?.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">
                              {task.subtasks.filter((s) => s.status === 'completed').length}/{task.subtasks.length} subtasks
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    <Badge variant={PRIORITY_BADGES[task.priority] || 'primary'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Completed Tasks section */}
              {completedTasks.length > 0 && (
                <div className="p-4 bg-slate-950/40">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Completed Today ({completedTasks.length})
                  </span>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <div key={task._id} className="flex items-center justify-between text-xs text-slate-500 py-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="line-through">{task.title}</span>
                        </div>
                        <span>{task.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
