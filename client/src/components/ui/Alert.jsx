import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Alert = ({
  className,
  variant = 'info',
  title,
  children,
  ...props
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    danger: 'bg-rose-500/10 border-rose-500/20 text-rose-200',
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-xl border text-sm', variants[variant], className)}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 text-slate-100">{title}</h5>}
        <div className="text-slate-300 text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
