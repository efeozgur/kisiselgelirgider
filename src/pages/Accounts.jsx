import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select, EmptyState, ConfirmModal, StatCard } from '../components/ui';
import { accountService } from '../services/services';
import { formatCurrency } from '../utils/helpers';
import { Plus, Wallet, Building2, CreditCard, TrendingUp, Bitcoin, Edit, Trash2 } from 'lucide-react';

const accountTypes = [
  { value: 'cash', label: 'Nakit', icon: Wallet, color: '#10b981' },
  { value: 'bank', label: 'Banka Hesabı', icon: Building2, color: '#0ea5e9' },
  { value: 'credit_card', label: 'Kredi Kartı', icon: CreditCard, color: '#ef4444' },
  { value: 'investment', label: 'Yatırım Hesabı', icon: TrendingUp, color: '#8b5cf6' },
  { value: 'crypto', label: 'Kripto Cüzdan', icon: Bitcoin, color: '#f59e0b' },
];

export function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    bank_name: '',
    iban: '',
    initial_balance: '0',
    color: '#0ea5e9',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    const accs = accountService.getAll();
    setAccounts(accs);
    const bals = {};
    accs.forEach(a => { bals[a.id] = accountService.getBalance(a.id); });
    setBalances(bals);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', type: 'cash', bank_name: '', iban: '', initial_balance: '0', color: '#0ea5e9' });
    setErrors({});
    setEditingAccount(null);
  };

  const openModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        bank_name: account.bank_name || '',
        iban: account.iban || '',
        initial_balance: account.initial_balance?.toString() || '0',
        color: account.color || '#0ea5e9',
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
    if (!formData.name.trim()) newErrors.name = 'Hesap adı gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      initial_balance: parseFloat(formData.initial_balance) || 0,
    };

    if (editingAccount) {
      accountService.update(editingAccount.id, data);
    } else {
      accountService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (account) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAccount) {
      accountService.delete(selectedAccount.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b, 0);
  const bankAccounts = accounts.filter(a => a.type === 'bank' || a.type === 'investment');
  const cardAccounts = accounts.filter(a => a.type === 'credit_card');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Hesaplar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{accounts.length} hesap</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Hesap</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Toplam Bakiye" value={formatCurrency(totalBalance)} icon={Wallet} color="sky" />
        <StatCard title="Banka/Yatırım" value={formatCurrency(bankAccounts.reduce((s, a) => s + (balances[a.id] || 0), 0))} icon={Building2} color="green" />
        <StatCard title="Kredi Kartları" value={formatCurrency(cardAccounts.reduce((s, a) => s + (balances[a.id] || 0), 0))} icon={CreditCard} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const typeInfo = accountTypes.find(t => t.value === account.type) || accountTypes[0];
          const Icon = typeInfo.icon;
          const balance = balances[account.id] || 0;

          return (
            <Card key={account.id} hover className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none" style={{ backgroundColor: account.color }} />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${account.color}20` }}>
                    <Icon size={24} style={{ color: account.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{account.name}</h3>
                    <p className="text-sm text-slate-500">{typeInfo.label}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(account)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit size={16} className="text-slate-400" />
                  </button>
                  <button onClick={() => handleDelete(account)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Güncel Bakiye</span>
                  <span className={`text-xl font-bold ${balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
                {account.bank_name && (
                  <p className="text-xs text-slate-400">{account.bank_name}</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <Badge variant="default">{account.currency || 'TRY'}</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Henüz hesap yok"
            description="İlk banka hesabınızı veya cüzdanınızı ekleyin"
            action={<Button onClick={() => openModal()} icon={Plus}>Hesap Ekle</Button>}
          />
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAccount ? 'Hesap Düzenle' : 'Yeni Hesap'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hesap Adı"
            placeholder="Örn: Garanti Bank"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          <Select
            label="Hesap Türü"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={accountTypes.map(t => ({ value: t.value, label: t.label }))}
          />

          {(formData.type === 'bank' || formData.type === 'investment' || formData.type === 'credit_card') && (
            <Input
              label="Banka Adı"
              placeholder="Örn: Garanti BBVA"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            />
          )}

          {(formData.type === 'bank' || formData.type === 'investment') && (
            <Input
              label="IBAN"
              placeholder="TR12 3456 7890..."
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
            />
          )}

          <Input
            label="Başlangıç Bakiyesi"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.initial_balance}
            onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hesap Rengi</label>
            <div className="flex gap-2">
              {['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-offset-2 ring-sky-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>İptal</Button>
            <Button type="submit">{editingAccount ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hesap Sil"
        message="Bu hesabı silmek istediğinizden emin misiniz? İlişkili işlemler korunur."
      />
    </div>
  );
}