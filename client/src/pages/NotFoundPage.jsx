import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-100">404 - Page Not Found</h1>
      <p className="text-sm text-slate-400 mt-2 max-w-md">
        The task workspace, view, or resource you are trying to access does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <NavLink to="/dashboard">
          <Button>
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </NavLink>
      </div>
    </div>
  );
};
