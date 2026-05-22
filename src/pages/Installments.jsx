import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select, Textarea, EmptyState, ConfirmModal, StatCard } from '../components/ui';
import { installmentService, accountService, categoryService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, CreditCard, Calendar, AlertTriangle, Check, Edit, Trash2, Eye } from 'lucide-react';

export function Installments() {
  const [installments, setInstallments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [installmentPayments, setInstallmentPayments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    total_amount: '',
    total_installments: '',
    first_payment_date: '',
    payment_day: '1',
    account_id: '',
    category_id: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    setInstallments(installmentService.getAll());
    setAccounts(accountService.getAll());
    setCategories(categoryService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      total_amount: '',
      total_installments: '',
      first_payment_date: new Date().toISOString().split('T')[0],
      payment_day: '1',
      account_id: '',
      category_id: '',
      description: '',
    });
    setErrors({});
    setEditingInstallment(null);
  };

  const openModal = (installment = null) => {
    if (installment) {
      setEditingInstallment(installment);
      setFormData({
        name: installment.name,
        total_amount: installment.total_amount.toString(),
        total_installments: installment.total_installments.toString(),
        first_payment_date: installment.first_payment_date,
        payment_day: installment.payment_day?.toString() || '1',
        account_id: installment.account_id || '',
        category_id: installment.category_id || '',
        description: installment.description || '',
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

  const openDetailModal = (installment) => {
    setSelectedInstallment(installment);
    const payments = installmentService.getPayments(installment.id);
    setInstallmentPayments(payments);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedInstallment(null);
    setInstallmentPayments([]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Alışveriş adı gerekli';
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) newErrors.total_amount = 'Geçerli tutar girin';
    if (!formData.total_installments || parseInt(formData.total_installments) < 2) newErrors.total_installments = 'En az 2 taksit olmalı';
    if (!formData.first_payment_date) newErrors.first_payment_date = 'İlk ödeme tarihi gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      total_amount: parseFloat(formData.total_amount),
      total_installments: parseInt(formData.total_installments),
      payment_day: parseInt(formData.payment_day),
    };

    if (editingInstallment) {
      installmentService.update(editingInstallment.id, data);
    } else {
      installmentService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (installment) => {
    setSelectedInstallment(installment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedInstallment) {
      installmentService.delete(selectedInstallment.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedInstallment(null);
  };

  const markPaymentPaid = (payment) => {
    installmentService.markPaymentPaid(payment.id);
    const payments = installmentService.getPayments(selectedInstallment.id);
    setInstallmentPayments(payments);
    loadData();
  };

  const thisMonthPayments = installmentService.getThisMonthPayments();
  const overduePayments = installmentService.getOverduePayments();
  const totalRemaining = installments.reduce((sum, i) => sum + i.remaining_amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Taksitler</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{installments.length} taksitli alışveriş</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Taksit</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Bu Ay Ödeme" value={formatCurrency(thisMonthPayments.reduce((s, p) => s + p.amount, 0))} icon={Calendar} color="amber" />
        <StatCard title="Geciken" value={overduePayments.length} icon={AlertTriangle} color="red" />
        <StatCard title="Toplam Kalan" value={formatCurrency(totalRemaining)} icon={CreditCard} color="sky" />
        <StatCard title="Aktif Taksit" value={installments.filter(i => i.status === 'active').length} icon={CreditCard} color="green" />
      </div>

      {installments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {installments.map((inst) => {
            const progress = (inst.paid_installments / inst.total_installments) * 100;
            return (
              <Card key={inst.id} hover className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{inst.name}</h3>
                    <p className="text-sm text-slate-500">{inst.category_name || 'Genel'}</p>
                  </div>
                  <Badge variant={inst.status === 'active' ? 'primary' : inst.status === 'completed' ? 'success' : 'danger'}>
                    {inst.status === 'active' ? 'Aktif' : inst.status === 'completed' ? 'Tamamlandı' : 'Gecikti'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Toplam</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(inst.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aylık Ödeme</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(inst.monthly_payment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kalan</span>
                    <span className="font-medium text-amber-500">{formatCurrency(inst.remaining_amount)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{inst.paid_installments}/{inst.total_installments} taksit</span>
                    <span>%{progress.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openDetailModal(inst)} className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1">
                    <Eye size={14} /> Detay
                  </button>
                  <button onClick={() => openModal(inst)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Edit size={16} className="text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(inst)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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
            icon={CreditCard}
            title="Henüz taksit yok"
            description="Taksitli alışverişlerinizi buradan takip edin"
            action={<Button onClick={() => openModal()} icon={Plus}>Taksit Ekle</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingInstallment ? 'Taksit Düzenle' : 'Yeni Taksitli Alışveriş'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Alışveriş Adı"
            placeholder="Örn: iPhone 15 Pro"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Toplam Tutar"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              error={errors.total_amount}
            />
            <Input
              label="Taksit Sayısı"
              type="number"
              placeholder="12"
              value={formData.total_installments}
              onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
              error={errors.total_installments}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="İlk Ödeme Tarihi"
              type="date"
              value={formData.first_payment_date}
              onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
              error={errors.first_payment_date}
            />
            <Input
              label="Ödeme Günü"
              type="number"
              min="1"
              max="28"
              placeholder="1"
              value={formData.payment_day}
              onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
            />
          </div>

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
            placeholder="Not..." rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {formData.total_amount && formData.total_installments && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500">Aylık Ödeme</p>
              <p className="text-2xl font-bold text-sky-500">
                {formatCurrency(parseFloat(formData.total_amount) / parseInt(formData.total_installments))}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingInstallment ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title={selectedInstallment?.name || 'Taksit Detay'}
        size="lg"
      >
        {selectedInstallment && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                <p className="text-sm text-slate-500">Toplam</p>
                <p className="text-xl font-bold">{formatCurrency(selectedInstallment.total_amount)}</p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                <p className="text-sm text-slate-500">Kalan</p>
                <p className="text-xl font-bold text-amber-500">{formatCurrency(selectedInstallment.remaining_amount)}</p>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                <p className="text-sm text-slate-500">Aylık</p>
                <p className="text-xl font-bold text-sky-500">{formatCurrency(selectedInstallment.monthly_payment)}</p>
              </div>
            </div>

            <h4 className="font-medium text-slate-700 dark:text-slate-300">Ödeme Planı</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {installmentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${payment.is_paid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      {payment.is_paid ? <Check size={16} /> : <Calendar size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{formatDate(payment.due_date)}</p>
                      <p className="text-xs text-slate-500">{payment.is_paid ? 'Ödendi' : 'Bekliyor'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    {!payment.is_paid && (
                      <button
                        onClick={() => markPaymentPaid(payment)}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Taksit Sil"
        message="Bu taksiti silmek istediğinizden emin misiniz?"
      />
    </div>
  );
}