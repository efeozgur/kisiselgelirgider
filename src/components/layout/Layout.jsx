import { Sidebar } from './Sidebar';
import { useState } from 'react';

export function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`
        transition-all duration-300 min-h-screen
        ${sidebarCollapsed ? 'ml-20' : 'ml-64'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}