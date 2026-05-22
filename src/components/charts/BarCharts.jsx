import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber } from '../../utils/helpers';

export function MonthlyBarChart({ data, title }) {
  return (
    <div>
      {title && <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => [`₺${formatNumber(value, 2)}`, name === 'income' ? 'Gelir' : 'Gider']}
          />
          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Gelir" />
          <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Gider" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccountBarChart({ data, title }) {
  return (
    <div>
      {title && <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '12px',
            }}
            formatter={(value) => `₺${formatNumber(value, 2)}`}
          />
          <Bar dataKey="balance" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Bakiye" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetProgressChart({ data, title }) {
  return (
    <div>
      {title && <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
            formatter={(value) => [`%${formatNumber(value, 1)}`, 'Harcama']}
            labelFormatter={(name) => name}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} name="Harcama">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.percentage >= 100 ? '#ef4444' : entry.percentage >= 80 ? '#f59e0b' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}