import { useState, useEffect } from 'react';
import { Card, StatCard, Badge } from '../components/ui';
import { analyticsService, anomalyService } from '../services/services';
import { formatCurrency } from '../utils/helpers';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatNumber = (value) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function Analytics() {
  const [trendData, setTrendData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [savingsPotential, setSavingsPotential] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [yoyData, setYoyData] = useState(null);

  const loadAnalytics = () => {
    const trend = analyticsService.getTrendAnalysis();
    setTrendData(trend);

    const forecastData = analyticsService.getForecast();
    setForecast(forecastData);

    const savings = analyticsService.getSavingsPotential();
    setSavingsPotential(savings);

    const anomalyList = anomalyService.getUnresolved();
    setAnomalies(anomalyList);

    const yoy = analyticsService.getYearOverYearComparison();
    setYoyData(yoy);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (!trendData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Analiz ve İstatistikler</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Finansal trendler ve öngörüler</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ortalama Gelir"
          value={formatCurrency(trendData.averageIncome)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Ortalama Gider"
          value={formatCurrency(trendData.averageExpense)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Gelir Trendi"
          value={`${trendData.incomeTrend > 0 ? '+' : ''}${trendData.incomeTrend.toFixed(1)}%`}
          icon={trendData.incomeTrend >= 0 ? TrendingUp : TrendingDown}
          color={trendData.incomeTrend >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Gider Trendi"
          value={`${trendData.expenseTrend > 0 ? '+' : ''}${trendData.expenseTrend.toFixed(1)}%`}
          icon={trendData.expenseTrend <= 0 ? TrendingUp : TrendingDown}
          color={trendData.expenseTrend <= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Aylık Gelir-Gider Trendi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData.monthlyData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tickFormatter={(v) => `₺${formatNumber(v / 1000)}k`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '12px',
                }}
                formatter={(value, name) => [`₺${formatNumber(value)}`, name === 'income' ? 'Gelir' : 'Gider']}
              />
              <Area type="monotone" dataKey="income" name="Gelir" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Gider" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Aylık Karşılaştırma (Bu Yıl vs Geçen Yıl)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yoyData?.thisYear?.map((t, i) => ({
              month: monthNames[t.month - 1],
              thisYear: t.income - t.expense,
              lastYear: yoyData.lastYear[i] ? yoyData.lastYear[i].income - yoyData.lastYear[i].expense : 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tickFormatter={(v) => `₺${formatNumber(v / 1000)}k`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '12px',
                }}
                formatter={(value, name) => [`₺${formatNumber(value)}`, name === 'thisYear' ? 'Bu Yıl' : 'Geçen Yıl']}
              />
              <Bar dataKey="thisYear" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Bu Yıl" />
              <Bar dataKey="lastYear" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Geçen Yıl" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {forecast && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Gelecek Ay Tahmini</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Tahmini Gelir</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(forecast.predictedIncome)}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-sm text-slate-500 mb-1">Tahmini Gider</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(forecast.predictedExpense)}</p>
            </div>
            <div className={`p-4 rounded-xl ${forecast.predictedNet >= 0 ? 'bg-sky-50 dark:bg-sky-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              <p className="text-sm text-slate-500 mb-1">Tahmini Net</p>
              <p className={`text-2xl font-bold ${forecast.predictedNet >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                {formatCurrency(Math.abs(forecast.predictedNet))}
                {forecast.predictedNet < 0 ? ' zarar' : ' kâr'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {savingsPotential && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} className="text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tasarruf Önerileri</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Aylık Tasarruf Potansiyeli</p>
                <p className="text-3xl font-bold text-amber-600">{formatCurrency(savingsPotential.monthlyPotential)}</p>
                <p className="text-sm text-slate-500 mt-1">Yıllık: {formatCurrency(savingsPotential.yearlyPotential)}</p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{savingsPotential.suggestion}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">En Yüksek Harcama Kategorileri</p>
              {savingsPotential.topCategories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-700 dark:text-slate-200">{cat.name}</span>
                  <div className="text-right">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(cat.amount)}</span>
                    <span className="text-xs text-emerald-500 ml-2">(-{formatCurrency(cat.potentialReduction)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {anomalies.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={24} className="text-red-500" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Anomali Tespitleri</h3>
            <Badge variant="danger">{anomalies.length}</Badge>
          </div>
          <div className="space-y-3">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div key={anomaly.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{anomaly.category_name || 'Bilinmeyen'}</p>
                  <p className="text-sm text-slate-500">
                    Beklenen: {formatCurrency(anomaly.expected_amount)} | Gerçek: {formatCurrency(anomaly.actual_amount)}
                  </p>
                </div>
                <span className="text-red-500 font-semibold">+%{anomaly.deviation_percent.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}