import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Modal, Input, Select, Textarea, EmptyState, ConfirmModal } from '../components/ui';
import { transactionService, accountService, categoryService } from '../services/services';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Search, Edit, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';

const typeLabels = { income: 'Gelir', expense: 'Gider', transfer: 'Transfer' };
const statusColors = { paid: 'success', pending: 'warning', scheduled: 'default' };
const statusLabels = { paid: 'Ödendi', pending: 'Bekliyor', scheduled: 'Planlandı' };

const paymentMethods = [
  { value: 'cash', label: 'Nakit' },
  { value: 'card', label: 'Kart' },
  { value: 'bank_transfer', label: 'Havale/EFT' },
  { value: 'other', label: 'Diğer' },
];

export function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    category_id: '',
    account_id: '',
    to_account_id: '',
    description: '',
    payment_method: 'cash',
    status: 'paid',
  });
  const [errors, setErrors] = useState({});

  const loadData = useCallback(() => {
    setTransactions(transactionService.getAll());
    setAccounts(accountService.getAll());
    setCategories(categoryService.getAll());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const filters = {};
    if (filterType) filters.type = filterType;
    if (filterAccount) filters.account_id = filterAccount;
    if (filterCategory) filters.category_id = filterCategory;
    if (filterStatus) filters.status = filterStatus;
    
    const results = searchQuery 
      ? transactionService.search(searchQuery) 
      : transactionService.getAll(filters);
    setTransactions(results);
  }, [searchQuery, filterType, filterAccount, filterCategory, filterStatus]);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      category_id: '',
      account_id: '',
      to_account_id: '',
      description: '',
      payment_method: 'cash',
      status: 'paid',
    });
    setErrors({});
    setEditingTransaction(null);
  };

  const openModal = (transaction = null) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        type: transaction.type,
        amount: transaction.amount.toString(),
        date: transaction.date,
        time: transaction.time || '',
        category_id: transaction.category_id || '',
        account_id: transaction.account_id || '',
        to_account_id: transaction.to_account_id || '',
        description: transaction.description || '',
        payment_method: transaction.payment_method || 'cash',
        status: transaction.status,
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
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Geçerli bir tutar girin';
    }
    if (!formData.date) {
      newErrors.date = 'Tarih seçin';
    }
    if (formData.type === 'transfer' && !formData.to_account_id) {
      newErrors.to_account_id = 'Hedef hesap seçin';
    }
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

    if (editingTransaction) {
      transactionService.update(editingTransaction.id, data);
    } else {
      transactionService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      transactionService.delete(selectedTransaction.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedTransaction(null);
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">İşlemler</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{transactions.length} işlem</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni İşlem</Button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="İşlem ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: '', label: 'Tüm Türler' },
                { value: 'income', label: 'Gelir' },
                { value: 'expense', label: 'Gider' },
                { value: 'transfer', label: 'Transfer' },
              ]}
              className="w-40"
            />
            <Select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              options={[
                { value: '', label: 'Tüm Hesaplar' },
                ...accounts.map(a => ({ value: a.id, label: a.name }))
              ]}
              className="w-40"
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: 'Tüm Durumlar' },
                { value: 'paid', label: 'Ödendi' },
                { value: 'pending', label: 'Bekliyor' },
                { value: 'scheduled', label: 'Planlandı' },
              ]}
              className="w-40"
            />
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">İşlem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hesap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' :
                          tx.type === 'expense' ? 'bg-red-100 text-red-600' :
                          'bg-sky-100 text-sky-600'
                        }`}>
                          {tx.type === 'income' ? <ArrowDownLeft size={18} /> :
                           tx.type === 'expense' ? <ArrowUpRight size={18} /> :
                           <ArrowLeftRight size={18} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">
                            {tx.description || typeLabels[tx.type]}
                          </p>
                          <p className="text-xs text-slate-500">{tx.payment_method}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tx.category_color || '#94a3b8' }} />
                        <span className="text-slate-700 dark:text-slate-300">{tx.category_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{tx.account_name || '-'}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-700 dark:text-slate-200">{formatDate(tx.date)}</p>
                        <p className="text-xs text-slate-500">{tx.time}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusColors[tx.status]}>{statusLabels[tx.status]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${
                        tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(tx)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <Edit size={16} className="text-slate-400" />
                        </button>
                        <button onClick={() => handleDelete(tx)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={ArrowUpRight}
            title="İşlem bulunamadı"
            description="Henüz işlem kaydedilmemiş veya arama kriterlerine uygun sonuç yok"
            action={<Button onClick={() => openModal()} icon={Plus}>İlk İşlemi Ekle</Button>}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? 'İşlem Düzenle' : 'Yeni İşlem'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'expense'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Gider
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'income'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Gelir
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'transfer', category_id: '' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'transfer'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Transfer
            </button>
          </div>

          <Input
            label="Tutar"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={errors.amount}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarih"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              error={errors.date}
            />
            <Input
              label="Saat"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          {formData.type !== 'transfer' && (
            <Select
              label="Kategori"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              options={filteredCategories.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Kategori seçin"
            />
          )}

          <Select
            label="Hesap"
            value={formData.account_id}
            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
            placeholder="Hesap seçin"
          />

          {formData.type === 'transfer' && (
            <Select
              label="Hedef Hesap"
              value={formData.to_account_id}
              onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
              options={accounts.filter(a => a.id !== formData.account_id).map(a => ({ value: a.id, label: a.name }))}
              placeholder="Hedef hesap seçin"
              error={errors.to_account_id}
            />
          )}

          {formData.type !== 'transfer' && (
            <Select
              label="Ödeme Yöntemi"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              options={paymentMethods}
            />
          )}

          <Textarea
            label="Açıklama"
            placeholder="İşlem açıklaması..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />

          <Select
            label="Durum"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'paid', label: 'Ödendi' },
              { value: 'pending', label: 'Bekliyor' },
              { value: 'scheduled', label: 'Planlandı' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingTransaction ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="İşlem Sil"
        message="Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}