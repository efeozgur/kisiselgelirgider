export function Badge({ children, variant = 'default', size = 'md' }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    primary: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-lg ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
          <Icon size={48} />
        </div>
      )}
      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="animate-spin">
      <svg className={`${sizes[size]} text-sky-500`} viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'sky', showLabel = false }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    sky: 'bg-sky-500',
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{value.toFixed(0)}</span>
          <span className="text-slate-500 dark:text-slate-500">{max.toFixed(0)}</span>
        </div>
      )}
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}