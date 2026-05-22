import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Select, Input, StatCard } from '../components/ui';
import { MonthlyLineChart, MonthlyBarChart, CategoryPieChart, AccountBarChart } from '../components/charts';
import { transactionService, budgetService, installmentService, debtService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('monthly');
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, net: 0, transactionCount: 0 });
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [installmentSummary, setInstallmentSummary] = useState({ total: 0, paid: 0, remaining: 0 });
  const [debtSummary, setDebtSummary] = useState({ debt: 0, receivable: 0 });

  const loadReportData = useCallback(() => {
    const expenseStats = transactionService.getCategoryStats('expense', startDate, endDate);
    const accountStats = transactionService.getAccountStats(startDate, endDate);
    const transactions = transactionService.getAll({ start_date: startDate, end_date: endDate });

    const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);

    setStats({
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
      transactionCount: transactions.length,
    });

    setCategoryData(expenseStats);
    setAccountData(accountStats.map(a => ({
      name: a.name,
      balance: (a.income || 0) - (a.expense || 0),
      color: a.color,
    })));

    const budgets = budgetService.getAllBudgetStatus();
    setBudgetStatus(budgets);

    const installments = installmentService.getAll();
    const totalInstallmentDebt = installments.reduce((s, i) => s + i.remaining_amount, 0);
    setInstallmentSummary({
      total: installments.reduce((s, i) => s + i.total_amount, 0),
      paid: installments.reduce((s, i) => s + (i.total_amount - i.remaining_amount), 0),
      remaining: totalInstallmentDebt,
    });

    setDebtSummary({
      debt: debtService.getTotalDebt(),
      receivable: debtService.getTotalReceivable(),
    });

    const months = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const m = current.getMonth() + 1;
      const y = current.getFullYear();
      const monthName = current.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });

      const income = transactionService.getMonthlyStats(m, y).income;
      const expense = transactionService.getMonthlyStats(m, y).expense;

      months.push({ month: monthName, income, expense });
      current.setMonth(current.getMonth() + 1);
    }

    setMonthlyData(months);
  }, [startDate, endDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const transactions = transactionService.getAll({ start_date: startDate, end_date: endDate });
    const accounts = transactionService.getAllBalances ? transactionService.getAllBalances() : [];
    const budgets = budgetService.getAllBudgetStatus();
    const installments = installmentService.getAll();
    const debts = debtService.getAll();
    const incomeCategories = transactionService.getCategoryStats('income', startDate, endDate);
    const expenseCategories = transactionService.getCategoryStats('expense', startDate, endDate);

    const wsSummary = XLSX.utils.aoa_to_sheet([
      ['FİNANSAL RAPOR', ''],
      ['Tarih Aralığı', `${formatDate(startDate)} - ${formatDate(endDate)}`],
      ['Rapor Tarihi', formatDate(new Date().toISOString().split('T')[0])],
      ['', ''],
      ['ÖZET BİLGİLER', ''],
      ['Toplam Gelir', stats.income, '₺'],
      ['Toplam Gider', stats.expense, '₺'],
      ['Net Durum', stats.net, '₺'],
      ['Toplam İşlem', stats.transactionCount, 'adet'],
      ['', ''],
      ['GELİR-GİDER ÖZETİ', ''],
      ['Toplam Gelir', stats.income, '₺'],
      ['Toplam Gider', stats.expense, '₺'],
      ['Net Durum', stats.net, '₺'],
      ['İşlem Sayısı', stats.transactionCount, 'adet'],
    ]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

    const wsIncome = XLSX.utils.aoa_to_sheet([
      ['GELİR KATEGORİLERİ', '', ''],
      ['Kategori', 'Toplam Tutar', 'İşlem Sayısı'],
      ...incomeCategories.map(c => [c.name, c.total, c.count]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsIncome, 'Gelir Kategorileri');

    const wsExpense = XLSX.utils.aoa_to_sheet([
      ['GİDER KATEGORİLERİ', '', ''],
      ['Kategori', 'Toplam Tutar', 'İşlem Sayısı'],
      ...expenseCategories.map(c => [c.name, c.total, c.count]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Gider Kategorileri');

    const wsTransactions = XLSX.utils.aoa_to_sheet([
      ['İŞLEM DETAYLARI', '', '', '', '', '', '', '', '', ''],
      ['Tarih', 'Saat', 'Tür', 'Kategori', 'Tutar', 'Hesap', 'Ödeme Yöntemi', 'Açıklama', 'Durum', 'Kalan Tutar'],
      ...transactions.map(t => [
        t.date,
        t.time || '',
        t.type === 'income' ? 'Gelir' : t.type === 'expense' ? 'Gider' : 'Transfer',
        t.category_name || '-',
        t.amount,
        t.account_name || '-',
        t.payment_method || '-',
        t.description || '-',
        t.status === 'paid' ? 'Ödendi' : t.status === 'pending' ? 'Bekliyor' : 'Planlandı',
        t.type === 'expense' && t.status === 'paid' ? (t.amount * 0.15).toFixed(2) : '-',
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'İşlemler');

    const accountStats = transactionService.getAccountStats(startDate, endDate);
    const wsAccounts = XLSX.utils.aoa_to_sheet([
      ['HESAP BAZLI ÖZET', '', '', '', ''],
      ['Hesap', 'Gelen', 'Giden', 'Net', 'Bakiye'],
      ...accountStats.map(a => [
        a.name,
        a.income || 0,
        a.expense || 0,
        (a.income || 0) - (a.expense || 0),
        a.name ? (accounts.find(acc => acc.name === a.name)?.current_balance || 0) : 0,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsAccounts, 'Hesaplar');

    const wsBudgets = XLSX.utils.aoa_to_sheet([
      ['BÜTÇE DURUMU', '', '', '', '', ''],
      ['Kategori', 'Limit', 'Harcama', 'Kalan', '%',
        'Durum'],
      ...budgets.map(b => [
        b.category_name,
        b.amount,
        b.spent,
        b.remaining,
        b.percentage.toFixed(1),
        b.isOverBudget ? 'Aşıldı' : b.isWarning ? 'Uyarı' : 'Normal',
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Bütçeler');

    const wsInstallments = XLSX.utils.aoa_to_sheet([
      ['TAKSİT ÖZETİ', '', '', '', '', ''],
      ['Alışveriş', 'Toplam', 'Ödenen', 'Kalan', 'Aylık Ödeme', 'Durum'],
      ...installments.map(i => [
        i.name,
        i.total_amount,
        i.total_amount - i.remaining_amount,
        i.remaining_amount,
        i.monthly_payment,
        i.status === 'active' ? 'Aktif' : i.status === 'completed' ? 'Tamamlandı' : 'Gecikti',
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsInstallments, 'Taksitler');

    const wsDebts = XLSX.utils.aoa_to_sheet([
      ['BORÇ/ALACAK DURUMU', '', '', '', '', ''],
      ['Kişi/Kurum', 'Tür', 'Toplam', 'Kalan', 'Son Tarih', 'Durum'],
      ...debts.map(d => [
        d.person_name,
        d.type === 'debt' ? 'Borç' : 'Alacak',
        d.amount,
        d.remaining_amount,
        d.due_date || '-',
        d.status === 'pending' ? 'Bekliyor' : d.status === 'paid' ? 'Ödendi' : 'Gecikti',
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsDebts, 'Borç-Alacak');

    const monthHeaders = [];
    const monthData = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      const m = current.getMonth() + 1;
      const y = current.getFullYear();
      monthHeaders.push(`${y}-${String(m).padStart(2, '0')}`);
      monthData.push(transactionService.getMonthlyStats(m, y));
      current.setMonth(current.getMonth() + 1);
    }

    const wsMonthly = XLSX.utils.aoa_to_sheet([
      ['AYLIK GELİR-GİDER', '', ''],
      ['Ay', 'Gelir', 'Gider', 'Net'],
      ...monthHeaders.map((h, i) => [
        h,
        monthData[i].income,
        monthData[i].expense,
        monthData[i].net,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Aylık Özet');

    XLSX.writeFile(wb, `finans_raporu_${startDate}_${endDate}.xlsx`);
  };

const exportToPDF = async () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pdfWidth, 50, 'F');

      pdf.setFontSize(28);
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FinansApp', margin, y + 8);

      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Finansal Rapor', margin, y + 16);

      pdf.setFontSize(9);
      pdf.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, pdfWidth - margin, y + 8, { align: 'right' });
      pdf.text(`Tarih: ${formatDate(new Date().toISOString().split('T')[0])}`, pdfWidth - margin, y + 14, { align: 'right' });

      y = 60;

      pdf.setFillColor(30, 41, 59);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 30, 3, 3, 'F');

      pdf.setFontSize(11);
      pdf.setTextColor(248, 250, 252);
      pdf.setFont('helvetica', 'bold');
      const col1X = margin + 5;
      const col2X = margin + 55;
      const col3X = margin + 95;
      const col4X = margin + 135;

      pdf.text('Toplam Gelir', col1X, y + 10);
      pdf.text(formatCurrency(stats.income), col1X, y + 20);

      pdf.text('Toplam Gider', col2X, y + 10);
      pdf.setTextColor(239, 68, 68);
      pdf.text(formatCurrency(stats.expense), col2X, y + 20);

      pdf.setTextColor(248, 250, 252);
      pdf.text('Net Durum', col3X, y + 10);
      pdf.setTextColor(stats.net >= 0 ? 16 : 239, stats.net >= 0 ? 185 : 68, stats.net >= 0 ? 129 : 68);
      pdf.text(formatCurrency(stats.net), col3X, y + 20);

      pdf.setTextColor(148, 163, 184);
      pdf.text('Islem', col4X, y + 10);
      pdf.setTextColor(248, 250, 252);
      pdf.text(String(stats.transactionCount), col4X, y + 20);

      y = 100;

      pdf.setFontSize(12);
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Islem Ozeti', margin, y);
      y += 8;

      pdf.setDrawColor(71, 85, 105);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pdfWidth - margin, y);
      y += 5;

      pdf.setFillColor(51, 65, 85);
      pdf.rect(margin, y, pdfWidth - margin * 2, 8, 'F');

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Kategori', margin + 3, y + 5.5);
      pdf.text('Tutar', pdfWidth - margin - 35, y + 5.5);
      pdf.text('Adet', pdfWidth - margin - 15, y + 5.5);
      y += 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(226, 232, 240);

      categoryData.slice(0, 10).forEach((cat, i) => {
        if (i % 2 === 0) {
          pdf.setFillColor(30, 41, 59);
          pdf.rect(margin, y - 3, pdfWidth - margin * 2, 7, 'F');
        }
        pdf.text((cat.name || 'Diger').substring(0, 25), margin + 3, y);
        pdf.text(formatCurrency(cat.total || 0), pdfWidth - margin - 35, y);
        pdf.text(String(cat.count || 0), pdfWidth - margin - 15, y);
        y += 7;
      });

      y += 10;

      pdf.setFontSize(12);
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Borc ve Alacak Durumu', margin, y);
      y += 8;

      pdf.line(margin, y, pdfWidth - margin, y);
      y += 5;

      pdf.setFillColor(51, 65, 85);
      pdf.roundedRect(margin, y, (pdfWidth - margin * 2) / 2 - 3, 20, 2, 2, 'F');
      pdf.roundedRect(pdfWidth / 2 + 3, y, (pdfWidth - margin * 2) / 2 - 3, 20, 2, 2, 'F');

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Toplam Borc', margin + 5, y + 8);
      pdf.setTextColor(239, 68, 68);
      pdf.setFontSize(12);
      pdf.text(formatCurrency(debtSummary.debt), margin + 5, y + 15);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Toplam Alacak', pdfWidth / 2 + 8, y + 8);
      pdf.setTextColor(16, 185, 129);
      pdf.setFontSize(12);
      pdf.text(formatCurrency(debtSummary.receivable), pdfWidth / 2 + 8, y + 15);

      y += 30;

      pdf.setFontSize(12);
      pdf.setTextColor(56, 189, 248);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Taksit Durumu', margin, y);
      y += 8;

      pdf.line(margin, y, pdfWidth - margin, y);
      y += 5;

      pdf.setFillColor(51, 65, 85);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 20, 2, 2, 'F');

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Kalan Taksit Borcu', margin + 5, y + 8);
      pdf.setTextColor(251, 191, 36);
      pdf.setFontSize(14);
      pdf.text(formatCurrency(installmentSummary.remaining), margin + 5, y + 16);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Odenen', pdfWidth / 2, y + 8);
      pdf.setTextColor(16, 185, 129);
      pdf.text(formatCurrency(installmentSummary.paid), pdfWidth / 2, y + 16);

      y += 30;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Bu rapor FinansApp tarafindan olusturulmustur.', pdfWidth / 2, y, { align: 'center' });

      pdf.save(`finans_raporu_${startDate}_${endDate}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF olusturulurken hata olustu: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Raporlar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Detaylı finansal raporlar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportToExcel}>Excel</Button>
          <Button icon={Download} onClick={exportToPDF}>PDF</Button>
        </div>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-4 items-end">
            <Input
              label="Başlangıç"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <Input
              label="Bitiş"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Select
              label="Rapor Türü"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'monthly', label: 'Aylık Özet' },
                { value: 'category', label: 'Kategori Bazlı' },
                { value: 'account', label: 'Hesap Bazlı' },
                { value: 'full', label: 'Tam Rapor' },
              ]}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      <div id="report-content" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Toplam Gelir" value={formatCurrency(stats.income)} icon={TrendingUp} color="green" />
          <StatCard title="Toplam Gider" value={formatCurrency(stats.expense)} icon={TrendingDown} color="red" />
          <StatCard title="Net Durum" value={formatCurrency(stats.net)} icon={stats.net >= 0 ? TrendingUp : TrendingDown} color={stats.net >= 0 ? 'green' : 'red'} />
          <StatCard title="İşlem Sayısı" value={stats.transactionCount} icon={FileText} color="sky" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Gelir-Gider Trend</h3>
            <MonthlyBarChart data={monthlyData} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Kategori Dağılımı</h3>
            <CategoryPieChart data={categoryData} />
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Aylık Trend</h3>
          <MonthlyLineChart data={monthlyData} />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Hesap Bazlı Hareket</h3>
            <AccountBarChart data={accountData} />
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Özet Bilgiler</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-500 mb-2">Taksit Durumu</p>
                <div className="flex justify-between items-center">
                  <span>Kalan Taksit Borcu</span>
                  <span className="text-xl font-bold text-amber-500">{formatCurrency(installmentSummary.remaining)}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-500 mb-2">Borç/Alacak</p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-red-500">Borç: {formatCurrency(debtSummary.debt)}</span>
                    <span className="mx-2">|</span>
                    <span className="text-emerald-500">Alacak: {formatCurrency(debtSummary.receivable)}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-sm text-slate-500 mb-2">Bütçe Durumu</p>
                <div className="space-y-2">
                  {budgetStatus.slice(0, 3).map(b => (
                    <div key={b.id} className="flex justify-between items-center text-sm">
                      <span>{b.category_name}</span>
                      <span className={b.isOverBudget ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}>
                        %{b.percentage.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}