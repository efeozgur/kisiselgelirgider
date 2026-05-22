import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, EmptyState, ConfirmModal, StatCard, ProgressBar } from '../components/ui';
import { savingsGoalService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Target, Edit, Trash2, Check, PlusCircle } from 'lucide-react';

export function Savings() {
  const [goals, setGoals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    icon: 'target',
    color: '#10b981',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    setGoals(savingsGoalService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', target_amount: '', target_date: '', icon: 'target', color: '#10b981' });
    setErrors({});
    setEditingGoal(null);
  };

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date || '',
        icon: goal.icon || 'target',
        color: goal.color || '#10b981',
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

  const openContributionModal = (goal) => {
    setSelectedGoal(goal);
    setContributionAmount('');
    setIsContributionModalOpen(true);
  };

  const closeContributionModal = () => {
    setIsContributionModalOpen(false);
    setSelectedGoal(null);
    setContributionAmount('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Hedef adı gerekli';
    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) newErrors.target_amount = 'Geçerli bir tutar girin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
    };

    if (editingGoal) {
      savingsGoalService.update(editingGoal.id, data);
    } else {
      savingsGoalService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleContribution = () => {
    if (!selectedGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) return;

    savingsGoalService.addContribution(selectedGoal.id, parseFloat(contributionAmount));
    closeContributionModal();
    loadData();
  };

  const handleDelete = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedGoal) {
      savingsGoalService.delete(selectedGoal.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedGoal(null);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tasarruf Hedefleri</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{goals.length} hedef</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Hedef</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Toplam Hedef" value={formatCurrency(totalTarget)} icon={Target} color="sky" />
        <StatCard title="Biriken Tutar" value={formatCurrency(totalSaved)} icon={Target} color="green" />
        <StatCard title="Tamamlanan" value={completedGoals} icon={Check} color="amber" />
      </div>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = (goal.current_amount / goal.target_amount) * 100;
            return (
              <Card key={goal.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                      <Target size={20} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{goal.name}</h3>
                      {goal.target_date && (
                        <p className="text-xs text-slate-500">{formatDate(goal.target_date)}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={goal.status === 'completed' ? 'success' : goal.status === 'paused' ? 'warning' : 'primary'}>
                    {goal.status === 'completed' ? 'Tamamlandı' : goal.status === 'paused' ? 'Duraklatıldı' : 'Aktif'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Mevcut</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(goal.current_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Hedef</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <ProgressBar
                    value={goal.current_amount}
                    max={goal.target_amount}
                    color={progress >= 100 ? 'green' : progress >= 50 ? 'amber' : 'sky'}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Kalan</span>
                    <span className={`font-medium ${goal.target_amount - goal.current_amount <= 0 ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {formatCurrency(goal.target_amount - goal.current_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" icon={PlusCircle} onClick={() => openContributionModal(goal)}>
                    Ekle
                  </Button>
                  <button onClick={() => openModal(goal)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Edit size={16} className="text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(goal)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Target}
            title="Henüz hedef yok"
            description="Tasarruf hedeflerinizi oluşturun ve takip edin"
            action={<Button onClick={() => openModal()} icon={Plus}>Hedef Oluştur</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingGoal ? 'Hedef Düzenle' : 'Yeni Tasarruf Hedefi'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hedef Adı"
            placeholder="Örn: Yeni Araba"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Input
            label="Hedef Tutar"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.target_amount}
            onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
            error={errors.target_amount}
          />

          <Input
            label="Hedef Tarih (Opsiyonel)"
            type="date"
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingGoal ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isContributionModalOpen}
        onClose={closeContributionModal}
        title="Par Biriktir"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{selectedGoal?.name}</p>
          <p className="text-lg font-semibold">Mevcut: {formatCurrency(selectedGoal?.current_amount || 0)} / {formatCurrency(selectedGoal?.target_amount || 0)}</p>
          <Input
            label="Eklenecek Tutar"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={contributionAmount}
            onChange={(e) => setContributionAmount(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeContributionModal}>İptal</Button>
            <Button onClick={handleContribution}>Ekle</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hedef Sil"
        message="Bu hedefi silmek istediğinizden emin misiniz?"
      />
    </div>
  );
}