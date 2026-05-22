import { useState, useEffect } from 'react';
import { Card, StatCard, Badge, EmptyState } from '../components/ui';
import { CategoryPieChart, PaymentMethodDonut, MonthlyLineChart, BalanceTrendChart, AccountBarChart, BudgetProgressChart } from '../components/charts';
import { transactionService, accountService, budgetService, installmentService, debtService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertTriangle, PiggyBank, ArrowRight } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    netBalance: 0,
    totalBalance: 0,
    topCategory: null,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [upcomingInstallments, setUpcomingInstallments] = useState([]);
  const [upcomingDebts, setUpcomingDebts] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [balanceTrend, setBalanceTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = () => {
    setLoading(true);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const startOfMonth = `${monthStr}-01`;
    const endOfMonth = `${monthStr}-31`;

    const monthlyStats = transactionService.getMonthlyStats(currentMonth, currentYear);
    const totalBalance = accountService.getTotalBalance();

    const categoryStats = transactionService.getCategoryStats('expense', startOfMonth, endOfMonth);
    const paymentStats = transactionService.getPaymentMethodStats(startOfMonth, endOfMonth);
    const recentTx = transactionService.getRecentTransactions(5);

    const monthRange = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthName = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      const s = transactionService.getMonthlyStats(m, y);
      monthRange.push({
        month: monthName,
        income: s.income,
        expense: s.expense,
      });
    }

    const balanceTrendData = monthRange.map((m, idx) => {
      let balance = 0;
      for (let j = 0; j <= idx; j++) {
        balance += monthRange[j].income - monthRange[j].expense;
      }
      return { month: m.month, balance };
    });

    setBalanceTrend(balanceTrendData);

    const accountsWithBalance = accountService.getAllBalances().map(acc => ({
      name: acc.name,
      balance: acc.current_balance,
      color: acc.color,
    }));

    const budgets = budgetService.getAllBudgetStatus().filter(b => b.category_type === 'expense').slice(0, 6);

    const installments = installmentService.getThisMonthPayments();
    const upcomingDebts = debtService.getUpcoming(7);

    setStats({
      monthlyIncome: monthlyStats.income,
      monthlyExpense: monthlyStats.expense,
      netBalance: monthlyStats.net,
      totalBalance,
      topCategory: categoryStats[0] || null,
    });

    setRecentTransactions(recentTx);
    setCategoryData(categoryStats);
    setMonthlyData(monthRange);
    setAccountBalances(accountsWithBalance);
    setBudgetStatus(budgets);
    setUpcomingInstallments(installments);
    setUpcomingDebts(upcomingDebts);
    setPaymentMethodData(paymentStats);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Badge variant="primary" size="lg">Bu Ay</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bu Ay Gelir"
          value={formatCurrency(stats.monthlyIncome)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Bu Ay Gider"
          value={formatCurrency(stats.monthlyExpense)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Net Durum"
          value={formatCurrency(stats.netBalance)}
          icon={stats.netBalance >= 0 ? TrendingUp : TrendingDown}
          color={stats.netBalance >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Toplam Bakiye"
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Gelir-Gider Trend</h3>
          <MonthlyLineChart data={monthlyData} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Kategori Dağılımı</h3>
            {stats.topCategory && (
              <Badge variant="primary">{stats.topCategory.name}</Badge>
            )}
          </div>
          <CategoryPieChart data={categoryData} />
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Ödeme Yöntemleri</h3>
          <PaymentMethodDonut data={paymentMethodData} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Hesap Bakiyeleri</h3>
          <AccountBarChart data={accountBalances} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bütçe Durumu</h3>
            {budgetStatus.some(b => b.isOverBudget) && (
              <Badge variant="danger">
                <AlertTriangle size={14} className="mr-1" />
                Aşılan Var
              </Badge>
            )}
          </div>
          {budgetStatus.length > 0 ? (
            <BudgetProgressChart data={budgetStatus.map(b => ({
              name: b.category_name,
              percentage: Math.min(b.percentage, 100),
            }))} />
          ) : (
            <EmptyState icon={PiggyBank} title="Bütçe yok" description="Kategori bazlı bütçe oluşturun" />
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Bakiye Trend</h3>
          <BalanceTrendChart data={balanceTrend} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Son İşlemler</h3>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tx.category_color}20` }}>
                      <ArrowRight size={18} style={{ color: tx.category_color }} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{tx.category_name || 'Transfer'}</p>
                      <p className="text-xs text-slate-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="İşlem yok" description="Henüz işlem kaydedilmemiş" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Bu Ay Taksitler</h3>
            <Badge variant="amber">{upcomingInstallments.length} ödeme</Badge>
          </div>
          {upcomingInstallments.length > 0 ? (
            <div className="space-y-3">
              {upcomingInstallments.slice(0, 4).map(payment => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{payment.installment_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(payment.due_date)}</p>
                  </div>
                  <span className="font-medium text-amber-500">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CreditCard} title="Taksit yok" description="Bu ay ödenecek taksit bulunmuyor" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Borç/Alacak</h3>
            {upcomingDebts.length > 0 && (
              <Badge variant="warning">{upcomingDebts.length} yaklaşan</Badge>
            )}
          </div>
          {upcomingDebts.length > 0 ? (
            <div className="space-y-3">
              {upcomingDebts.slice(0, 4).map(debt => (
                <div key={debt.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{debt.person_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(debt.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${debt.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {debt.type === 'debt' ? '-' : '+'}{formatCurrency(debt.remaining_amount)}
                    </span>
                    <Badge variant={debt.type === 'debt' ? 'danger' : 'success'} size="sm" className="ml-2">
                      {debt.type === 'debt' ? 'Borç' : 'Alacak'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={AlertTriangle} title="Veri yok" description="Yaklaşan borç/alacak yok" />
          )}
        </Card>
      </div>
    </div>
  );
}