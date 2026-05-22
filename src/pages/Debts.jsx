import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Textarea, EmptyState, ConfirmModal, StatCard } from '../components/ui';
import { debtService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Scale, AlertTriangle, Check, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function Debts() {
  const [debts, setDebts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [formData, setFormData] = useState({
    person_name: '',
    type: 'debt',
    amount: '',
    due_date: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    setDebts(debtService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ person_name: '', type: 'debt', amount: '', due_date: '', description: '' });
    setErrors({});
    setEditingDebt(null);
  };

  const openModal = (debt = null) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        person_name: debt.person_name,
        type: debt.type,
        amount: debt.amount.toString(),
        due_date: debt.due_date || '',
        description: debt.description || '',
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
    if (!formData.person_name.trim()) newErrors.person_name = 'Kişi adı gerekli';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Geçerli tutar girin';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      remaining_amount: parseFloat(formData.amount),
    };

    if (editingDebt) {
      debtService.update(editingDebt.id, data);
    } else {
      debtService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (debt) => {
    setSelectedDebt(debt);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDebt) {
      debtService.delete(selectedDebt.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedDebt(null);
  };

  const markAsPaid = (debt) => {
    debtService.markAsPaid(debt.id);
    loadData();
  };

  const totalDebt = debtService.getTotalDebt();
  const totalReceivable = debtService.getTotalReceivable();
  const upcomingDebts = debtService.getUpcoming(7);
  const overdueDebts = debtService.getOverdue();

  const activeDebts = debts.filter(d => d.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Borç / Alacak</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{activeDebts.length} aktif</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Kayıt</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Borçlarım" value={formatCurrency(totalDebt)} icon={ArrowUpRight} color="red" />
        <StatCard title="Alacaklarım" value={formatCurrency(totalReceivable)} icon={ArrowDownLeft} color="green" />
        <StatCard title="Yaklaşan" value={upcomingDebts.length} icon={Scale} color="amber" />
        <StatCard title="Geciken" value={overdueDebts.length} icon={AlertTriangle} color="red" />
      </div>

      {activeDebts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDebts.map((debt) => {
            const isOverdue = debt.due_date && new Date(debt.due_date) < new Date() && debt.status === 'pending';
            return (
              <Card key={debt.id} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${debt.type === 'debt' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {debt.type === 'debt' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{debt.person_name}</h3>
                      <Badge variant={debt.type === 'debt' ? 'danger' : 'success'} size="sm">
                        {debt.type === 'debt' ? 'Borç' : 'Alacak'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(debt)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                      <Edit size={16} className="text-slate-400" />
                    </button>
                    <button onClick={() => handleDelete(debt)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Toplam Tutar</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(debt.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kalan</span>
                    <span className={`font-medium ${debt.remaining_amount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {formatCurrency(debt.remaining_amount)}
                    </span>
                  </div>
                  {debt.due_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Son Tarih</span>
                      <span className={`font-medium ${isOverdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {formatDate(debt.due_date)}
                        {isOverdue && <AlertTriangle size={14} className="inline ml-1" />}
                      </span>
                    </div>
                  )}
                </div>

                {debt.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{debt.description}</p>
                )}

                {debt.status !== 'paid' && (
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => markAsPaid(debt)} icon={Check}>
                    Olarak İşaretle
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Scale}
            title="Henüz borç/alacak yok"
            description="Borç ve alacak takibinizi buradan yapın"
            action={<Button onClick={() => openModal()} icon={Plus}>Kayıt Ekle</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDebt ? 'Kayıt Düzenle' : 'Yeni Borç/Alacak'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'debt' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'debt'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Borç
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'receivable' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'receivable'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Alacak
            </button>
          </div>

          <Input
            label="Kişi / Kurum Adı"
            placeholder="Örn: Ahmet Yılmaz"
            value={formData.person_name}
            onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
            error={errors.person_name}
          />

          <Input
            label="Tutar"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
          />

          <Input
            label="Son Ödeme Tarihi (Opsiyonel)"
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />

          <Textarea
            label="Açıklama"
            placeholder="Not..." rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingDebt ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Kayıt Sil"
        message="Bu kaydı silmek istediğinizden emin misiniz?"
      />
    </div>
  );
}