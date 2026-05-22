import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout';
import {
  Dashboard,
  Transactions,
  Accounts,
  Categories,
  Budgets,
  Installments,
  Debts,
  Reports,
  Settings
} from './pages';
import { initDatabase, seedDemoData } from './database/db';
import { useEffect, useState } from 'react';

function AppContent() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Initializing database...');
    initDatabase()
      .then(() => {
        console.log('Database initialized, seeding demo data...');
        seedDemoData();
        console.log('Demo data seeded, setting ready...');
        setDbReady(true);
      })
      .catch((err) => {
        console.error('Database init error:', err);
        setError(err.message);
      });
  }, []);

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4" />
          {error ? (
            <p className="text-red-500">Hata: {error}</p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Veritabanı hazırlanıyor...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/installments" element={<Installments />} />
        <Route path="/debts" element={<Debts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}