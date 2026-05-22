export function Card({ children, className = '', hover = false, padding = true }) {
  return (
    <div className={`
      glass-card ${padding ? 'p-6' : ''}
      ${hover ? 'hover:scale-[1.02] hover:shadow-xl transition-all duration-200 cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'sky' }) {
  const colors = {
    sky: 'text-sky-500 bg-sky-500/10',
    green: 'text-emerald-500 bg-emerald-500/10',
    red: 'text-red-500 bg-red-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2 text-slate-800 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}