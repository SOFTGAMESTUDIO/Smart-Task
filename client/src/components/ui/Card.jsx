import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, elevated = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        elevated
          ? 'bg-slate-900/90 border-slate-700/60 shadow-lg shadow-black/40'
          : 'bg-slate-900/60 border-slate-800/80 shadow-md shadow-black/20 hover:border-slate-700/60',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-5 border-b border-slate-800/80 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100 tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
};
