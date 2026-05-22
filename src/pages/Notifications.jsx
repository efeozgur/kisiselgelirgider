import { useState, useEffect } from 'react';
import { Card, Button, Badge, EmptyState } from '../components/ui';
import { notificationService } from '../services/services';
import { formatDate } from '../utils/helpers';
import { Bell, Check, Trash2, AlertTriangle, Info, CreditCard, PiggyBank } from 'lucide-react';

const typeIcons = {
  budget_warning: PiggyBank,
  budget_overflow: AlertTriangle,
  upcoming_payment: CreditCard,
  debt_due: AlertTriangle,
  anomaly: AlertTriangle,
  subscription_due: CreditCard,
  general: Info,
};

const typeLabels = {
  budget_warning: 'Bütçe Uyarısı',
  budget_overflow: 'Bütçe Aşımı',
  upcoming_payment: 'Yaklaşan Ödeme',
  debt_due: 'Borç Vadesi',
  anomaly: 'Anomali',
  subscription_due: 'Abonelik',
  general: 'Genel',
};

const typeColors = {
  budget_warning: 'warning',
  budget_overflow: 'danger',
  upcoming_payment: 'primary',
  debt_due: 'warning',
  anomaly: 'danger',
  subscription_due: 'primary',
  general: 'default',
};

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadData = () => {
    setNotifications(notificationService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = (id) => {
    notificationService.markAsRead(id);
    loadData();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadData();
  };

  const handleDelete = (id) => {
    notificationService.delete(id);
    loadData();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    loadData();
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bildirimler</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tüm bildirimler okundu'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" icon={Check} onClick={handleMarkAllAsRead}>
              Tümünü Okundu İşaretle
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="danger" icon={Trash2} onClick={handleClearAll}>
              Tümünü Temizle
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'all' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilter('budget_warning')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'budget_warning' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Bütçe Uyarıları
        </button>
        <button
          onClick={() => setFilter('upcoming_payment')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'upcoming_payment' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Yaklaşan Ödemeler
        </button>
        <button
          onClick={() => setFilter('anomaly')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'anomaly' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
        >
          Anomaliler
        </button>
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Info;
            return (
              <Card key={notification.id} className={`${!notification.is_read ? 'border-l-4 border-l-sky-500' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    notification.type === 'budget_overflow' || notification.type === 'anomaly'
                      ? 'bg-red-100 text-red-600'
                      : notification.type === 'budget_warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-sky-100 text-sky-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 dark:text-white">{notification.title}</h3>
                      <Badge variant={typeColors[notification.type] || 'default'} size="sm">
                        {typeLabels[notification.type] || 'Genel'}
                      </Badge>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{notification.message}</p>
                    )}
                    <p className="text-xs text-slate-500">{formatDate(notification.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        title="Okundu işaretle"
                      >
                        <Check size={16} className="text-slate-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Sil"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Bell}
            title="Bildirim yok"
            description={filter === 'all' ? 'Henüz bildiriminiz yok' : 'Bu kategoride bildirim yok'}
          />
        </Card>
      )}
    </div>
  );
}