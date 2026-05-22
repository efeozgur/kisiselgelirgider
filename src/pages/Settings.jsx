import { useState } from 'react';
import { Card, Button, ConfirmModal } from '../components/ui';
import { accountService, categoryService } from '../services/services';
import { exportDatabase, clearAllData } from '../database/db';
import { Download, Upload, Trash2, Database, Palette, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';

export function Settings() {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState(null);

  const handleExportJSON = () => {
    const data = exportDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finans_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setImportData(data);
        setIsImportModalOpen(true);
      } catch {
        alert('Geçersiz dosya formatı');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (importData) {
      localStorage.setItem('finansapp_db', importData);
      window.location.reload();
    }
    setIsImportModalOpen(false);
    setImportData(null);
  };

  const handleClearData = () => {
    clearAllData();
    window.location.reload();
  };

  const handleExportExcel = () => {
    const accounts = accountService.getAll();
    const categories = categoryService.getAll();

    const wb = XLSX.utils.book_new();

    const accData = [['Hesap Adı', 'Tür', 'Banka', 'IBAN', 'Başlangıç Bakiyesi', 'Para Birimi', 'Renk']];
    accounts.forEach(a => {
      accData.push([a.name, a.type, a.bank_name || '', a.iban || '', a.initial_balance, a.currency, a.color]);
    });
    const wsAccounts = XLSX.utils.aoa_to_sheet(accData);
    XLSX.utils.book_append_sheet(wb, wsAccounts, 'Hesaplar');

    const catData = [['Kategori', 'Tür', 'Renk', 'Aylık Limit']];
    categories.forEach(c => {
      catData.push([c.name, c.type, c.color, c.monthly_limit || '']);
    });
    const wsCategories = XLSX.utils.aoa_to_sheet(catData);
    XLSX.utils.book_append_sheet(wb, wsCategories, 'Kategoriler');

    XLSX.writeFile(wb, 'finans_veriler.xlsx');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ayarlar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Uygulama ayarları ve veri yönetimi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-sky-900/30 rounded-xl text-sky-400">
              <Palette size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Tema</h3>
              <p className="text-sm text-slate-400">Görünüm ayarları</p>
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-sm text-slate-400 mb-2">Glassmorphism efekti aktif</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg text-sm">Blur efekt</span>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg text-sm">Transparan kartlar</span>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg text-sm">Gradient arka plan</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-500">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Veri Yönetimi</h3>
              <p className="text-sm text-slate-500">Yedekleme ve geri yükleme</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-start" icon={Download} onClick={handleExportJSON}>
              JSON Yedek İndir
            </Button>
            <Button variant="secondary" className="w-full justify-start" icon={Upload}>
              <label className="cursor-pointer">
                JSON Geri Yükle
                <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
              </label>
            </Button>
            <Button variant="secondary" className="w-full justify-start" icon={Download} onClick={handleExportExcel}>
              Excel Export
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Tehlikeli Bölge</h3>
              <p className="text-sm text-slate-500">Veri silme işlemleri</p>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Tüm verileri silmek, uygulamanın başlangıç durumuna geri dönmesine neden olur. Bu işlem geri alınamaz.
            </p>
            <Button variant="danger" icon={Trash2} onClick={() => setIsClearModalOpen(true)}>
              Tüm Verileri Sil
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-500">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Uygulama Bilgisi</h3>
              <p className="text-sm text-slate-500">Versiyon ve lisans</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-500">Versiyon</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-500">Veritabanı</p>
              <p className="text-lg font-semibold">SQLite (sql.js)</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-500">Framework</p>
              <p className="text-lg font-semibold">React + Vite</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-sm text-slate-500">Kullanıcı</p>
              <p className="text-lg font-semibold">Kişisel Kullanım</p>
            </div>
          </div>
        </Card>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearData}
        title="Tüm Verileri Sil"
        message="Tüm verileriniz silinecek. Bu işlem geri alınamaz. Emin misiniz?"
        confirmText="Sil"
      />

      <ConfirmModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={confirmImport}
        title="Verileri Geri Yükle"
        message="Mevcut verileriniz değiştirilecek. Devam etmek istiyor musunuz?"
        confirmText="Geri Yükle"
        variant="primary"
      />
    </div>
  );
}