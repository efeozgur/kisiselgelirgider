import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, subscriptionService, debtService, budgetService } from '../services/services';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(() => {
    const unread = notificationService.getUnread();
    setUnreadCount(unread.length);
    setNotifications(unread.slice(0, 10));
  }, []);

  const checkAndGenerateNotifications = useCallback(() => {
    const now = new Date();
    const budgets = budgetService.getAllBudgetStatus();
    budgets.forEach(b => {
      if (b.isOverBudget) {
        notificationService.create({
          type: 'budget_overflow',
          title: 'Bütçe Aşıldı',
          message: `${b.category_name} kategorisinde bütçe ${b.percentage.toFixed(0)}% aşıldı.`,
          data: { budget_id: b.id, category_name: b.category_name }
        });
      } else if (b.isWarning) {
        notificationService.create({
          type: 'budget_warning',
          title: 'Bütçe Uyarısı',
          message: `${b.category_name} kategorisinde bütçe ${b.percentage.toFixed(0)}% kullanıldı.`,
          data: { budget_id: b.id, category_name: b.category_name }
        });
      }
    });

    const upcomingSubscriptions = subscriptionService.getUpcoming(3);
    upcomingSubscriptions.forEach(sub => {
      const daysUntil = Math.ceil((new Date(sub.next_date) - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 1) {
        notificationService.create({
          type: 'subscription_due',
          title: 'Abonelik Ödemesi Yaklaşıyor',
          message: `${sub.name} için ${sub.amount} TL ödeme yarın.`,
          data: { subscription_id: sub.id }
        });
      }
    });

    const upcomingDebts = debtService.getUpcoming(3);
    upcomingDebts.forEach(debt => {
      const daysUntil = Math.ceil((new Date(debt.due_date) - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) {
        notificationService.create({
          type: 'debt_due',
          title: 'Borç Vadesi Yaklaşıyor',
          message: `${debt.person_name} için ${debt.remaining_amount} TL ödeme ${daysUntil} gün içinde.`,
          data: { debt_id: debt.id }
        });
      }
    });

    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(checkAndGenerateNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications, checkAndGenerateNotifications]);

  const markAsRead = useCallback((id) => {
    notificationService.markAsRead(id);
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
    loadNotifications();
  }, [loadNotifications]);

  const addNotification = useCallback((data) => {
    notificationService.create(data);
    loadNotifications();
  }, [loadNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      loadNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}