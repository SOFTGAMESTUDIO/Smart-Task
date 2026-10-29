import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Database,
  Code2,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
  Activity,
  Calendar,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState('');

  // Live tasks query
  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: async () => {
      const res = await apiClient.getTasks();
      return res.data || [];
    },
    staleTime: 1000 * 20,
  });

  const totalTasks = allTasks.length;
  const criticalTasks = allTasks.filter((t) => t.priority === 'Critical').length;
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const activeTasks = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  const metrics = [
    { label: "Active Commitments", value: `${activeTasks.length} tasks`, hint: `${criticalTasks} critical priority`, icon: Calendar, color: 'text-blue-400' },
    { label: 'Total Catalog', value: `${totalTasks} items`, hint: 'Stored in database', icon: Layers, color: 'text-amber-400' },
    { label: 'Completed', value: `${completedTasks} tasks`, hint: 'Verified done', icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'High Priority', value: `${criticalTasks} tasks`, hint: 'Urgent attention', icon: AlertTriangle, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Smart Task Platform Operational
            </span>
            <span className="text-xs text-slate-400">Live API Ready</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Welcome to Smart Task Platform
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Modular task management powered by local SQLite database and deterministic priority scoring engine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
            View All Tasks
          </Button>
          <Button size="sm" onClick={() => navigate('/query')}>
            <Database className="w-4 h-4 text-blue-200" />
            <span>SQL Query Studio</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{metric.value}</p>
                  <span className="text-[11px] text-slate-400">{metric.hint}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Split: Recommended Focus & Quick AI Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Next Execution Order (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card elevated>
            <CardHeader>
              <div>
                <CardTitle>Recommended Execution Order</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated by deterministic engine (user weights + deadline urgency + dependencies)
                </p>
              </div>
              <Badge variant="primary">Deterministic Priority</Badge>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-800/60">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-2" />
                  <span className="text-xs">Loading task priorities...</span>
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No pending tasks found. Create a new task to get priority recommendations.
                </div>
              ) : (
                activeTasks.slice(0, 5).map((task, idx) => (
                  <div
                    key={task._id}
                    className="p-3.5 sm:p-4 hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 mt-0.5 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-100 hover:text-blue-400 cursor-pointer transition-colors break-words">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-slate-400">
                          <span className="truncate max-w-[150px] sm:max-w-none">{task.category}</span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{task.estimatedMinutes} mins</span>
                          </span>
                          {task.recommendationReason && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-[11px] text-blue-400/90 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                {task.recommendationReason}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="self-end sm:self-center shrink-0">
                      <Badge
                        variant={
                          task.priority === 'Critical'
                            ? 'danger'
                            : task.priority === 'High'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Privacy & Safety Alert */}
          <Alert variant="info" title="Privacy & Data Safety Active">
            The platform operates in non-destructive mode. Your live database is never purged or dropped. You can configure your MongoDB Atlas credentials and local Ollama model in your private .env file whenever you are ready.
          </Alert>
        </div>

        {/* AI Quick Decomposition Input (1 col) */}
        <div className="space-y-4">
          <Card elevated>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <CardTitle>Direct SQL Query</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Query, filter, and inspect tasks directly on your local SQLite database with SQL precision and zero network latency.
              </p>

              <div className="relative">
                <textarea
                  rows={4}
                  value={quickInput || "SELECT id, title, priority, status, dueAt FROM tasks WHERE status != 'completed' ORDER BY priority ASC LIMIT 10;"}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Enter custom SQL query (e.g. SELECT * FROM tasks WHERE priority = 'Critical')..."
                  className="w-full rounded-lg bg-slate-950/80 border border-slate-700/80 p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  spellCheck="false"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-mono">Database: ./tasks.sqlite</span>
                <Button size="sm" onClick={() => navigate('/query')}>
                  <span>Run in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Engine Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <CardTitle>Platform Health & Integrity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Backend API</span>
                <span className="text-emerald-400 font-medium">Port 5005 (Operational)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Database Layer</span>
                <span className="text-emerald-400 font-medium">Local SQLite (Connected)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Query Engine</span>
                <span className="text-blue-400 font-medium">Interactive Studio Active</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Priority Engine</span>
                <span className="text-emerald-400 font-medium">Deterministic Scoring</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
