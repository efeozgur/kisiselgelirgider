import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatNumber } from '../../utils/helpers';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function CategoryPieChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p className="text-sm">Veri yok</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {title && <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => [`₺${formatNumber(value, 2)}`, name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

const paymentMethodLabels = {
  cash: 'Nakit',
  card: 'Kart',
  bank_transfer: 'Havale/EFT',
  other: 'Diğer',
};

export function PaymentMethodDonut({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p className="text-sm">Veri yok</p>
      </div>
    );
  }

  const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="payment_method"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none',
              borderRadius: '12px',
            }}
            formatter={(value, name) => [`₺${value.toFixed(2)}`, paymentMethodLabels[name] || name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {data.map((item, index) => (
          <div key={item.payment_method} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-slate-600 dark:text-slate-400">{paymentMethodLabels[item.payment_method] || item.payment_method}</span>
          </div>
        ))}
      </div>
    </div>
  );
}