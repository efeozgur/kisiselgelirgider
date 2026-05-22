import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select, Textarea, EmptyState, ConfirmModal, StatCard } from '../components/ui';
import { subscriptionService, accountService, categoryService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, RefreshCw, Calendar, Check, Edit, Trash2 } from 'lucide-react';

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    next_date: '',
    category_id: '',
    account_id: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    setSubscriptions(subscriptionService.getAll());
    setAccounts(accountService.getAll());
    setCategories(categoryService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      next_date: new Date().toISOString().split('T')[0],
      category_id: '',
      account_id: '',
      description: '',
    });
    setErrors({});
    setEditingSubscription(null);
  };

  const openModal = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        frequency: subscription.frequency,
        next_date: subscription.next_date,
        category_id: subscription.category_id || '',
        account_id: subscription.account_id || '',
        description: subscription.description || '',
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
    if (!formData.name.trim()) newErrors.name = 'Abonelik adı gerekli';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Geçerli bir tutar girin';
    if (!formData.next_date) newErrors.next_date = 'Sonraki ödeme tarihi gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingSubscription) {
      subscriptionService.update(editingSubscription.id, data);
    } else {
      subscriptionService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (subscription) => {
    setSelectedSubscription(subscription);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubscription) {
      subscriptionService.delete(selectedSubscription.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedSubscription(null);
  };

  const handleMarkAsPaid = (subscription) => {
    subscriptionService.markAsPaid(subscription.id);
    loadData();
  };

  const activeSubscriptions = subscriptions.filter(s => s.is_active);
  const totalMonthly = subscriptionService.getTotalMonthlyAmount();
  const upcomingSubscriptions = subscriptionService.getUpcoming(7);

  const frequencyLabels = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    yearly: 'Yıllık',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Abonelikler</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{activeSubscriptions.length} aktif abonelik</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Abonelik</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Aylık Maliyet" value={formatCurrency(totalMonthly)} icon={Calendar} color="amber" />
        <StatCard title="Yaklaşan (7 gün)" value={upcomingSubscriptions.length} icon={RefreshCw} color="sky" />
        <StatCard title="Toplam Abonelik" value={activeSubscriptions.length} icon={RefreshCw} color="green" />
      </div>

      {subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map((sub) => {
            const daysUntil = Math.ceil((new Date(sub.next_date) - new Date()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntil <= 3 && daysUntil >= 0;
            const isOverdue = daysUntil < 0;

            return (
              <Card key={sub.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'}`}>
                      <RefreshCw size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{sub.name}</h3>
                      <p className="text-xs text-slate-500">{sub.category_name || 'Genel'}</p>
                    </div>
                  </div>
                  <Badge variant={sub.is_active ? 'success' : 'default'}>
                    {sub.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tutar</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(sub.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Frekans</span>
                    <span className="text-slate-700 dark:text-slate-200">{frequencyLabels[sub.frequency]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sonraki Ödeme</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {formatDate(sub.next_date)}
                      {isOverdue && ' (Gecikmiş)'}
                      {!isOverdue && daysUntil <= 7 && ` (${daysUntil} gün)`}
                    </span>
                  </div>
                  {sub.account_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Hesap</span>
                      <span className="text-slate-700 dark:text-slate-200">{sub.account_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" icon={Check} onClick={() => handleMarkAsPaid(sub)}>
                    Ödendi
                  </Button>
                  <button onClick={() => openModal(sub)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Edit size={16} className="text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(sub)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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
            icon={RefreshCw}
            title="Henüz abonelik yok"
            description="Abonelik ve tekrarlayan ödemelerinizi buradan takip edin"
            action={<Button onClick={() => openModal()} icon={Plus}>Abonelik Ekle</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSubscription ? 'Abonelik Düzenle' : 'Yeni Abonelik'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Abonelik Adı"
            placeholder="Örn: Netflix, Spotify"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tutar"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              error={errors.amount}
            />
            <Select
              label="Frekans"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              options={[
                { value: 'daily', label: 'Günlük' },
                { value: 'weekly', label: 'Haftalık' },
                { value: 'monthly', label: 'Aylık' },
                { value: 'yearly', label: 'Yıllık' },
              ]}
            />
          </div>

          <Input
            label="Sonraki Ödeme Tarihi"
            type="date"
            value={formData.next_date}
            onChange={(e) => setFormData({ ...formData, next_date: e.target.value })}
            error={errors.next_date}
          />

          <Select
            label="Hesap"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
            placeholder="Hesap seçin"
          />

          <Select
            label="Kategori"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            options={categories.filter(c => c.type === 'expense').map(c => ({ value: c.id, label: c.name }))}
            placeholder="Kategori seçin"
          />

          <Textarea
            label="Açıklama"
            placeholder="Not..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingSubscription ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Abonelik Sil"
        message="Bu abonelik kaydını silmek istediğinizden emin misiniz?"
      />
    </div>
  );
}