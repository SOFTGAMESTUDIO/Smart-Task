import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus, Cpu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Button } from '../ui/Button';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/today': 'Today\'s Focus',
  '/tasks': 'Tasks',
  '/inbox': 'Capture Inbox',
  '/query': 'SQL Query Studio',
  '/ai-planner': 'SQL Query Studio',
  '/settings': 'Priority Settings',
};

export const TopBar = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = routeTitles[location.pathname] || 'Overview';

  // Fast-response background health query cached by TanStack React Query
  const { data: healthData, isError, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await apiClient.checkHealth();
      return res.data;
    },
    refetchInterval: 15000,
    retry: 1,
  });

  const isDbConnected = healthData?.services?.database === 'connected';

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden shrink-0 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
          <span className="text-xs text-slate-500 hidden sm:inline">Workspace /</span>
          <h1 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{currentTitle}</h1>
        </div>
      </div>

      {/* Right section: System Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Compact Status Dot */}
        <div
          className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px]"
          title={isDbConnected ? 'Atlas Database Connected' : 'Connecting to Database'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : isError
                ? 'bg-rose-500'
                : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
            }`}
          />
          <span className="text-slate-400 text-[9px] font-mono">DB</span>
        </div>

        {/* Desktop Backend Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : isError
                ? 'bg-rose-500'
                : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {isLoading
              ? 'Checking API...'
              : isError
              ? 'API Offline'
              : `Atlas (${healthData?.services?.database || 'ready'})`}
          </span>
        </div>

        {/* Local LLM Engine Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
          <Cpu className="w-3.5 h-3.5" />
          <span>Ollama: {healthData?.services?.ollama === 'connected' ? 'Qwen Ready' : 'Standby'}</span>
        </div>

        {/* Quick Task Action (Desktop + Mobile) */}
        <Button
          size="sm"
          onClick={() => navigate('/tasks', { state: { openNew: true } })}
          className="px-2.5 sm:px-3 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Task</span>
        </Button>

        {/* User Avatar Placeholder */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
          U
        </div>
      </div>
    </header>
  );
};
