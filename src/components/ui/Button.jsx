import { forwardRef } from 'react';

const variants = {
  primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40',
  secondary: 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
  ghost: 'bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300',
  outline: 'border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';