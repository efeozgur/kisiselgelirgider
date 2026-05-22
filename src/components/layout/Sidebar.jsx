import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  PiggyBank,
  CreditCard,
  Scale,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'İşlemler' },
  { path: '/accounts', icon: Wallet, label: 'Hesaplar' },
  { path: '/categories', icon: Tags, label: 'Kategoriler' },
  { path: '/budgets', icon: PiggyBank, label: 'Bütçe' },
  { path: '/installments', icon: CreditCard, label: 'Taksitler' },
  { path: '/debts', icon: Scale, label: 'Borç/Alacak' },
  { path: '/reports', icon: BarChart3, label: 'Raporlar' },
  { path: '/settings', icon: Settings, label: 'Ayarlar' },
];

export function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside className={`
      glass-sidebar fixed left-0 top-0 h-full z-40
      transition-all duration-300 flex flex-col
      ${collapsed ? 'w-20' : 'w-64'}
    `}>
      <div className="p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">₺</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg text-white">FinansApp</h1>
              <p className="text-xs text-slate-400">Kişisel Finans</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={`
              nav-item ${location.pathname === path ? 'active' : ''}
              ${collapsed ? 'justify-center px-2' : ''}
            `}
            title={collapsed ? label : undefined}
          >
            <Icon size={22} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700/30">
        <button
          onClick={onToggle}
          className="nav-item w-full"
        >
          {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
          {!collapsed && <span>Daralt</span>}
        </button>
      </div>
    </aside>
  );
}