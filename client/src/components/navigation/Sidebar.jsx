import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Inbox,
  Sparkles,
  Sliders,
  Briefcase,
  Truck,
  Layers,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigationLinks = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Today\'s Focus', to: '/today', icon: Calendar },
  { name: 'All Tasks', to: '/tasks', icon: CheckSquare },
  { name: 'Inbox', to: '/inbox', icon: Inbox },
  { name: 'AI Planner', to: '/ai-planner', icon: Sparkles, badge: 'AI' },
];

const workspaceLinks = [
  { name: 'Freelance & Dev', to: '/workspace/freelance', icon: Briefcase, phase: 'Phase 5' },
  { name: 'Delivery Dispatch', to: '/workspace/delivery', icon: Truck, phase: 'Phase 5' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-800/80">
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                SmartTask <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-500/20 text-blue-400 rounded">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Platform v1.0</div>
            </div>
          </NavLink>

          {/* Explicit Mobile Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Core Navigation */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Productivity
            </div>
            <nav className="space-y-1">
              {navigationLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-blue-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Specialized Workspaces */}
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="space-y-1">
              {workspaceLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 cursor-not-allowed group opacity-75"
                    title="Scheduled for Phase 5"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-300" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.phase}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Configuration */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )
            }
          >
            <Sliders className="w-4 h-4" />
            <span>Priority & Rules</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
