import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, EmptyState, ConfirmModal } from '../components/ui';
import { categoryService } from '../services/services';
import { Plus, Tag, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const defaultColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e'];

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#ef4444',
    monthly_limit: '',
  });
  const [errors, setErrors] = useState({});

  const loadData = () => {
    setCategories(categoryService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const newCategories = filterType ? categoryService.getByType(filterType) : categoryService.getAll();
    setCategories(newCategories);
  }, [filterType]);

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', color: '#ef4444', monthly_limit: '' });
    setErrors({});
    setEditingCategory(null);
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || '#ef4444',
        monthly_limit: category.monthly_limit?.toString() || '',
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
    if (!formData.name.trim()) newErrors.name = 'Kategori adı gerekli';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      type: formData.type,
      monthly_limit: formData.monthly_limit ? parseFloat(formData.monthly_limit) : null,
    };

    if (editingCategory) {
      categoryService.update(editingCategory.id, data);
    } else {
      categoryService.create(data);
    }

    closeModal();
    loadData();
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      categoryService.delete(selectedCategory.id);
      loadData();
    }
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kategoriler</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{categories.length} kategori</p>
        </div>
        <Button icon={Plus} onClick={() => openModal()}>Yeni Kategori</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType('')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            !filterType ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          <TrendingDown size={16} /> Gider
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
            filterType === 'income' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          <TrendingUp size={16} /> Gelir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Gider Kategorileri</h3>
            <Badge variant="danger" size="sm">{expenseCategories.length}</Badge>
          </div>
          {expenseCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {expenseCategories.map(cat => (
                <div key={cat.id} className="glass-button p-3 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                    <Tag size={16} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{cat.name}</p>
                    {cat.monthly_limit && (
                      <p className="text-xs text-slate-400">₺{cat.monthly_limit.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button onClick={() => openModal(cat)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Tag} title="Gider kategorisi yok" description="Gider kategorisi ekleyin" />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="font-semibold text-slate-800 dark:text-white">Gelir Kategorileri</h3>
            <Badge variant="success" size="sm">{incomeCategories.length}</Badge>
          </div>
          {incomeCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {incomeCategories.map(cat => (
                <div key={cat.id} className="glass-button p-3 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                    <Tag size={16} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{cat.name}</p>
                    {cat.monthly_limit && (
                      <p className="text-xs text-slate-400">₺{cat.monthly_limit.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button onClick={() => openModal(cat)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Tag} title="Gelir kategorisi yok" description="Gelir kategorisi ekleyin" />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense', color: '#ef4444' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Gider
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income', color: '#10b981' })}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                formData.type === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              Gelir
            </button>
          </div>

          <Input
            label="Kategori Adı"
            placeholder="Örn: Market"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />

          {formData.type === 'expense' && (
            <Input
              label="Aylık Limit (Opsiyonel)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.monthly_limit}
              onChange={(e) => setFormData({ ...formData, monthly_limit: e.target.value })}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Renk</label>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map(color => (
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
            <Button type="submit">{editingCategory ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Kategori Sil"
        message="Bu kategoriyi silmek istediğinizden emin misiniz? İlişkili işlemler etkilenebilir."
      />
    </div>
  );
}