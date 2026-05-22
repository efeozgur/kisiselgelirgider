import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select, EmptyState, ConfirmModal, StatCard, ProgressBar } from '../components/ui';
import { budgetService, categoryService } from '../services/services';
import { formatCurrency } from '../utils/helpers';
import { Plus, PiggyBank, AlertTriangle, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

export function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    period: 'monthly',
    warning_threshold: '80',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    const budgetList = budgetService.getAllBudgetStatus();
    setBudgets(budgetList);
    setCategories(categoryService.getByType('expense'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ category_id: '', amount: '', period: 'monthly', warning_threshold: '80' });
    setErrors({});
    setEditingBudget(null);
  };

  const openModal = (budget = null) => {
    if (budget) {
      const orig = budgetService.getById(budget.id);
      setEditingBudget(budget);
      setFormData({
        category_id: orig.category_id,
        amount: orig.amount.toString(),
        period: orig.period,
        warning_threshold: orig.warning_threshold.toString(),
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = 'Kategori seçin';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Geçerli bir tutar girin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      category_id: formData.category_id,
      amount: parseFloat(formData.amount),
      period: formData.period,
      warning_threshold: parseFloat(formData.warning_threshold),
    };

    if (editingBudget) {
      budgetService.update(editingBudget.id, data);
    } else {
      budgetService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (budget) => {
    setSelectedBudget(budget);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBudget) {
      budgetService.delete(selectedBudget.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedBudget(null);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.isOverBudget).length;
  const warningCount = budgets.filter(b => b.isWarning && !b.isOverBudget).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bütçe</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{budgets.length} bütçe planı</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Bütçe</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Toplam Bütçe" value={formatCurrency(totalBudget)} icon={PiggyBank} color="sky" />
        <StatCard title="Toplam Harcama" value={formatCurrency(totalSpent)} icon={totalSpent > totalBudget ? TrendingDown : TrendingUp} color={totalSpent > totalBudget ? 'red' : 'green'} />
        <StatCard title="Kalan" value={formatCurrency(totalBudget - totalSpent)} icon={PiggyBank} color={totalBudget - totalSpent >= 0 ? 'green' : 'red'} />
        <StatCard title="Uyarı" value={overBudgetCount + warningCount} icon={AlertTriangle} color={overBudgetCount > 0 ? 'red' : 'amber'} />
      </div>

      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id} hover className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${budget.category_color}20` }}>
                    <span className="text-lg" style={{ color: budget.category_color }}>●</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{budget.category_name}</h3>
                    <p className="text-xs text-slate-500">{budget.period === 'monthly' ? 'Aylık' : 'Haftalık'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(budget)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit size={16} className="text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(budget)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Harcama</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(budget.spent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Limit</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(budget.amount)}</span>
                </div>
                <ProgressBar
                  value={budget.spent}
                  max={budget.amount}
                  color={budget.isOverBudget ? 'red' : budget.isWarning ? 'amber' : 'green'}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Kalan</span>
                  <span className={`font-medium ${budget.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatCurrency(budget.remaining)}
                  </span>
                </div>
              </div>

              {budget.isOverBudget && (
                <Badge variant="danger" className="w-full justify-center">
                  <AlertTriangle size={14} className="mr-1" /> Bütçe Aşıldı
                </Badge>
              )}
              {budget.isWarning && !budget.isOverBudget && (
                <Badge variant="warning" className="w-full justify-center">
                  <AlertTriangle size={14} className="mr-1" /> %{budget.warning_threshold} Uyarı
                </Badge>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={PiggyBank}
            title="Henüz bütçe yok"
            description="Kategori bazlı bütçe oluşturun ve harcamalarınızı takip edin"
            action={<Button onClick={() => openModal()} icon={Plus}>Bütçe Oluştur</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? 'Bütçe Düzenle' : 'Yeni Bütçe'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Kategori"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Kategori seçin"
            error={errors.category_id}
          />

          <Input
            label="Aylık Limit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
          />

          <Select
            label="Dönem"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            options={[
              { value: 'monthly', label: 'Aylık' },
              { value: 'weekly', label: 'Haftalık' },
            ]}
          />

          <Input
            label="Uyarı Eşiği (%)"
            type="number"
            placeholder="80"
            value={formData.warning_threshold}
            onChange={(e) => setFormData({ ...formData, warning_threshold: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingBudget ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Bütçe Sil"
        message="Bu bütçeyi silmek istediğinizden emin misiniz?"
      />
    </div>
  );
}