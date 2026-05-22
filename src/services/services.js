import { runQuery, runInsert, runUpdate, runDelete } from '../database/db';
import { generateId } from '../utils/helpers';

export const transactionService = {
  getAll(filters = {}) {
    let sql = `
      SELECT t.*, 
             c.name as category_name, c.color as category_color, c.icon as category_icon,
             s.name as subcategory_name,
             a.name as account_name, a.color as account_color,
             ta.name as to_account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.type) {
      sql += ' AND t.type = ?';
      params.push(filters.type);
    }
    if (filters.account_id) {
      sql += ' AND (t.account_id = ? OR t.to_account_id = ?)';
      params.push(filters.account_id, filters.account_id);
    }
    if (filters.category_id) {
      sql += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.status) {
      sql += ' AND t.status = ?';
      params.push(filters.status);
    }
    if (filters.start_date) {
      sql += ' AND t.date >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ' AND t.date <= ?';
      params.push(filters.end_date);
    }

    sql += ' ORDER BY t.date DESC, t.time DESC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
    }

    return runQuery(sql, params);
  },

  getById(id) {
    const results = runQuery(`
      SELECT t.*, 
             c.name as category_name, c.color as category_color,
             a.name as account_name,
             ta.name as to_account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts ta ON t.to_account_id = ta.id
      WHERE t.id = ?
    `, [id]);
    return results[0];
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();
    const date = data.date || now.split('T')[0];
    const time = data.time || new Date().toISOString().split('T')[1].slice(0, 5);

    runInsert(`
      INSERT INTO transactions (id, type, amount, currency, date, time, category_id, subcategory_id, description, payment_method, account_id, to_account_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.type,
      data.amount,
      data.currency || 'TRY',
      date,
      time,
      data.category_id || null,
      data.subcategory_id || null,
      data.description || '',
      data.payment_method || 'cash',
      data.account_id || null,
      data.to_account_id || null,
      data.status || 'paid',
      now,
      now
    ]);

    return id;
  },

  update(id, data) {
    const now = new Date().toISOString();
    return runUpdate(`
      UPDATE transactions SET
        type = ?,
        amount = ?,
        currency = COALESCE(?, currency),
        date = ?,
        time = ?,
        category_id = ?,
        subcategory_id = ?,
        description = ?,
        payment_method = ?,
        account_id = ?,
        to_account_id = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      data.type,
      data.amount != null ? data.amount : null,
      data.currency,
      data.date,
      data.time,
      data.category_id || null,
      data.subcategory_id || null,
      data.description,
      data.payment_method,
      data.account_id || null,
      data.to_account_id || null,
      data.status,
      now,
      id
    ]);
  },

  delete(id) {
    return runDelete('DELETE FROM transactions WHERE id = ?', [id]);
  },

  getMonthlyStats(month, year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const income = runQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income' AND date >= ? AND date <= ? AND status = 'paid'
    `, [startDate, endDate])[0].total;

    const expense = runQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense' AND date >= ? AND date <= ? AND status = 'paid'
    `, [startDate, endDate])[0].total;

    return { income, expense, net: income - expense };
  },

  getCategoryStats(type, startDate, endDate) {
    return runQuery(`
      SELECT c.id, c.name, c.color, c.icon,
             COALESCE(SUM(t.amount), 0) as total,
             COUNT(t.id) as count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND t.type = ? AND t.date >= ? AND t.date <= ? AND t.status = 'paid'
      GROUP BY c.id
      HAVING total > 0
      ORDER BY total DESC
    `, [type, startDate, endDate]);
  },

  getAccountStats(startDate, endDate) {
    return runQuery(`
      SELECT a.id, a.name, a.color, a.type,
             COALESCE(SUM(CASE WHEN t.type = 'income' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0) as income,
             COALESCE(SUM(CASE WHEN t.type = 'expense' AND t.account_id = a.id THEN t.amount ELSE 0 END), 0) as expense,
             COALESCE(SUM(CASE WHEN t.type = 'transfer' AND (t.account_id = a.id OR t.to_account_id = a.id) THEN 
               CASE WHEN t.account_id = a.id THEN -t.amount ELSE t.amount END ELSE 0 END), 0) as transfers
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id OR t.to_account_id = a.id
        AND t.date >= ? AND t.date <= ?
      GROUP BY a.id
    `, [startDate, endDate]);
  },

  getPaymentMethodStats(startDate, endDate) {
    return runQuery(`
      SELECT payment_method, 
             COALESCE(SUM(amount), 0) as total,
             COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' AND date >= ? AND date <= ? AND status = 'paid'
      GROUP BY payment_method
      ORDER BY total DESC
    `, [startDate, endDate]);
  },

  getRecentTransactions(limit = 5) {
    return this.getAll({ limit });
  },

  search(query) {
    return runQuery(`
      SELECT t.*, c.name as category_name, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.description LIKE ? OR c.name LIKE ? OR a.name LIKE ?
      ORDER BY t.date DESC
      LIMIT 50
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
  }
};

export const accountService = {
  getAll() {
    return runQuery('SELECT * FROM accounts ORDER BY name');
  },

  getById(id) {
    const results = runQuery('SELECT * FROM accounts WHERE id = ?', [id]);
    return results[0];
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO accounts (id, name, type, bank_name, iban, initial_balance, currency, color, icon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      data.type,
      data.bank_name || null,
      data.iban || null,
      data.initial_balance || 0,
      data.currency || 'TRY',
      data.color || '#0ea5e9',
      data.icon || 'wallet',
      now,
      now
    ]);

    return id;
  },

  update(id, data) {
    const now = new Date().toISOString();
    return runUpdate(`
      UPDATE accounts SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        bank_name = ?,
        iban = ?,
        currency = COALESCE(?, currency),
        color = COALESCE(?, color),
        icon = COALESCE(?, icon),
        updated_at = ?
      WHERE id = ?
    `, [
      data.name,
      data.type,
      data.bank_name || null,
      data.iban || null,
      data.currency,
      data.color,
      data.icon,
      now,
      id
    ]);
  },

  delete(id) {
    return runDelete('DELETE FROM accounts WHERE id = ?', [id]);
  },

  getBalance(id) {
    const account = this.getById(id);
    if (!account) return 0;

    const transactions = runQuery(`
      SELECT type, amount, account_id, to_account_id
      FROM transactions
      WHERE (account_id = ? OR to_account_id = ?) AND status = 'paid'
    `, [id, id]);

    let balance = account.initial_balance;
    transactions.forEach(t => {
      if (t.account_id === id) {
        if (t.type === 'income') balance += t.amount;
        else if (t.type === 'expense') balance -= t.amount;
        else if (t.type === 'transfer') balance -= t.amount;
      } else if (t.to_account_id === id) {
        if (t.type === 'transfer') balance += t.amount;
      }
    });

    return balance;
  },

  getAllBalances() {
    const accounts = this.getAll();
    return accounts.map(acc => ({
      ...acc,
      current_balance: this.getBalance(acc.id)
    }));
  },

  getTotalBalance() {
    const balances = this.getAllBalances();
    return balances.reduce((sum, acc) => sum + acc.current_balance, 0);
  }
};

export const categoryService = {
  getAll() {
    return runQuery('SELECT * FROM categories ORDER BY type, name');
  },

  getById(id) {
    const results = runQuery('SELECT * FROM categories WHERE id = ?', [id]);
    return results[0];
  },

  getByType(type) {
    return runQuery('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO categories (id, name, type, icon, color, monthly_limit, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      data.type,
      data.icon || 'tag',
      data.color || '#10b981',
      data.monthly_limit || null,
      now
    ]);

    return id;
  },

  update(id, data) {
    return runUpdate(`
      UPDATE categories SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        monthly_limit = ?
      WHERE id = ?
    `, [
      data.name,
      data.type,
      data.icon,
      data.color,
      data.monthly_limit != null ? data.monthly_limit : null,
      id
    ]);
  },

  delete(id) {
    return runDelete('DELETE FROM categories WHERE id = ?', [id]);
  },

  getSubcategories(categoryId) {
    return runQuery('SELECT * FROM subcategories WHERE category_id = ? ORDER BY name', [categoryId]);
  },

  createSubcategory(data) {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO subcategories (id, category_id, name, icon, color, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, data.category_id, data.name, data.icon || 'tag', data.color || null, now]);

    return id;
  },

  deleteSubcategory(id) {
    return runDelete('DELETE FROM subcategories WHERE id = ?', [id]);
  }
};

export const budgetService = {
  getAll() {
    return runQuery(`
      SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon, c.type as category_type
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      ORDER BY c.name
    `);
  },

  getById(id) {
    const results = runQuery(`
      SELECT b.*, c.name as category_name, c.color as category_color, c.type as category_type
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `, [id]);
    return results[0];
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO budgets (id, category_id, amount, period, start_date, end_date, warning_threshold, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.category_id,
      data.amount,
      data.period || 'monthly',
      data.start_date || null,
      data.end_date || null,
      data.warning_threshold || 80,
      now
    ]);

    return id;
  },

  update(id, data) {
    return runUpdate(`
      UPDATE budgets SET
        amount = COALESCE(?, amount),
        period = COALESCE(?, period),
        start_date = ?,
        end_date = ?,
        warning_threshold = COALESCE(?, warning_threshold)
      WHERE id = ?
    `, [
      data.amount,
      data.period,
      data.start_date || null,
      data.end_date || null,
      data.warning_threshold,
      id
    ]);
  },

  delete(id) {
    return runDelete('DELETE FROM budgets WHERE id = ?', [id]);
  },

  getSpentAmount(categoryId, startDate, endDate) {
    const result = runQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE category_id = ? AND type = 'expense' AND status = 'paid'
        AND date >= ? AND date <= ?
    `, [categoryId, startDate, endDate]);
    return result[0]?.total || 0;
  },

  getBudgetStatus(budgetId) {
    const budget = this.getById(budgetId);
    if (!budget) return null;

    const now = new Date();
    const startDate = budget.start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    
    const endDate = budget.end_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

    const spent = this.getSpentAmount(budget.category_id, startDate, endDate);
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget.amount,
      isWarning: percentage >= budget.warning_threshold
    };
  },

  getAllBudgetStatus() {
    const budgets = this.getAll();
    return budgets.map(b => this.getBudgetStatus(b.id));
  }
};

export const installmentService = {
  getAll() {
    return runQuery(`
      SELECT i.*, c.name as category_name, a.name as account_name
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN accounts a ON i.account_id = a.id
      ORDER BY i.first_payment_date DESC
    `);
  },

  getById(id) {
    const results = runQuery(`
      SELECT i.*, c.name as category_name, a.name as account_name
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN accounts a ON i.account_id = a.id
      WHERE i.id = ?
    `, [id]);
    return results[0];
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();

    const totalAmount = parseFloat(data.total_amount);
    const totalInstallments = parseInt(data.total_installments);
    const monthlyPayment = Math.round((totalAmount / totalInstallments) * 100) / 100;
    const remainingAmount = totalAmount;

    runInsert(`
      INSERT INTO installments (id, name, total_amount, total_installments, paid_installments, remaining_amount, monthly_payment, first_payment_date, last_payment_date, payment_day, account_id, category_id, description, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      totalAmount,
      totalInstallments,
      0,
      remainingAmount,
      monthlyPayment,
      data.first_payment_date,
      data.last_payment_date || null,
      data.payment_day || 1,
      data.account_id || null,
      data.category_id || null,
      data.description || '',
      'active',
      now
    ]);

    this.generatePayments(id, data.first_payment_date, totalInstallments, monthlyPayment);

    return id;
  },

  generatePayments(installmentId, firstDate, totalInstallments, monthlyPayment) {
    const first = new Date(firstDate);
    const payments = [];

    for (let i = 0; i < totalInstallments; i++) {
      const paymentDate = new Date(first);
      paymentDate.setMonth(paymentDate.getMonth() + i);

      payments.push({
        id: generateId(),
        installment_id: installmentId,
        amount: monthlyPayment,
        payment_date: paymentDate.toISOString().split('T')[0],
        due_date: paymentDate.toISOString().split('T')[0],
        is_paid: 0
      });
    }

    payments.forEach(p => {
      runInsert(`
        INSERT INTO installment_payments (id, installment_id, amount, payment_date, due_date, is_paid)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [p.id, p.installment_id, p.amount, p.payment_date, p.due_date, p.is_paid]);
    });
  },

  update(id, data) {
    return runUpdate(`
      UPDATE installments SET
        name = COALESCE(?, name),
        account_id = ?,
        category_id = ?,
        description = COALESCE(?, description),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [
      data.name,
      data.account_id || null,
      data.category_id || null,
      data.description,
      data.status,
      id
    ]);
  },

  delete(id) {
    runDelete('DELETE FROM installment_payments WHERE installment_id = ?', [id]);
    return runDelete('DELETE FROM installments WHERE id = ?', [id]);
  },

  markPaymentPaid(paymentId) {
    const payment = runQuery('SELECT * FROM installment_payments WHERE id = ?', [paymentId])[0];
    if (!payment) return false;

    runUpdate('UPDATE installment_payments SET is_paid = 1 WHERE id = ?', [paymentId]);

    const installment = this.getById(payment.installment_id);
    const paidCount = runQuery('SELECT COUNT(*) as count FROM installment_payments WHERE installment_id = ? AND is_paid = 1', [installment.id])[0].count;

    runUpdate('UPDATE installments SET paid_installments = ?, remaining_amount = remaining_amount - ? WHERE id = ?', 
      [paidCount, payment.amount, installment.id]);

    if (paidCount >= installment.total_installments) {
      runUpdate('UPDATE installments SET status = ? WHERE id = ?', ['completed', installment.id]);
    }

    return true;
  },

  getPayments(installmentId) {
    return runQuery(`
      SELECT * FROM installment_payments 
      WHERE installment_id = ?
      ORDER BY payment_date
    `, [installmentId]);
  },

  getUpcomingPayments(months = 1) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);

    return runQuery(`
      SELECT ip.*, i.name as installment_name, i.monthly_payment, a.name as account_name
      FROM installment_payments ip
      JOIN installments i ON ip.installment_id = i.id
      LEFT JOIN accounts a ON i.account_id = a.id
      WHERE ip.is_paid = 0 AND ip.due_date >= ? AND ip.due_date <= ?
      ORDER BY ip.due_date
    `, [now.toISOString().split('T')[0], futureDate.toISOString().split('T')[0]]);
  },

  getOverduePayments() {
    const today = new Date().toISOString().split('T')[0];
    return runQuery(`
      SELECT ip.*, i.name as installment_name, i.monthly_payment, a.name as account_name
      FROM installment_payments ip
      JOIN installments i ON ip.installment_id = i.id
      LEFT JOIN accounts a ON i.account_id = a.id
      WHERE ip.is_paid = 0 AND ip.due_date < ?
      ORDER BY ip.due_date
    `, [today]);
  },

  getThisMonthPayments() {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

    return runQuery(`
      SELECT ip.*, i.name as installment_name, i.monthly_payment, a.name as account_name
      FROM installment_payments ip
      JOIN installments i ON ip.installment_id = i.id
      LEFT JOIN accounts a ON i.account_id = a.id
      WHERE ip.is_paid = 0 AND ip.due_date >= ? AND ip.due_date <= ?
      ORDER BY ip.due_date
    `, [startOfMonth, endOfMonth]);
  }
};

export const debtService = {
  getAll() {
    return runQuery('SELECT * FROM debts ORDER BY due_date');
  },

  getById(id) {
    const results = runQuery('SELECT * FROM debts WHERE id = ?', [id]);
    return results[0];
  },

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO debts (id, person_name, type, amount, remaining_amount, due_date, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.person_name,
      data.type,
      data.amount,
      data.remaining_amount ?? data.amount,
      data.due_date || null,
      data.description || '',
      'pending',
      now,
      now
    ]);

    return id;
  },

  update(id, data) {
    const now = new Date().toISOString();
    return runUpdate(`
      UPDATE debts SET
        person_name = COALESCE(?, person_name),
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        remaining_amount = COALESCE(?, remaining_amount),
        due_date = ?,
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `, [
      data.person_name,
      data.type,
      data.amount,
      data.remaining_amount,
      data.due_date || null,
      data.description,
      data.status,
      now,
      id
    ]);
  },

  delete(id) {
    return runDelete('DELETE FROM debts WHERE id = ?', [id]);
  },

  markAsPaid(id) {
    const now = new Date().toISOString();
    return runUpdate(`
      UPDATE debts SET status = 'paid', remaining_amount = 0, updated_at = ? WHERE id = ?
    `, [now, id]);
  },

  getUpcoming(days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return runQuery(`
      SELECT * FROM debts 
      WHERE status = 'pending' AND due_date >= ? AND due_date <= ?
      ORDER BY due_date
    `, [today.toISOString().split('T')[0], futureDate.toISOString().split('T')[0]]);
  },

  getOverdue() {
    const today = new Date().toISOString().split('T')[0];
    return runQuery(`
      SELECT * FROM debts 
      WHERE status = 'pending' AND due_date < ?
      ORDER BY due_date
    `, [today]);
  },

  getTotalDebt() {
    const result = runQuery(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total FROM debts WHERE type = 'debt' AND status = 'pending'
    `);
    return result[0]?.total || 0;
  },

  getTotalReceivable() {
    const result = runQuery(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total FROM debts WHERE type = 'receivable' AND status = 'pending'
    `);
    return result[0]?.total || 0;
  }
};

export const tagService = {
  getAll() {
    return runQuery('SELECT * FROM tags ORDER BY name');
  },

  create(name, color = '#6366f1') {
    const id = generateId();
    const now = new Date().toISOString();

    runInsert(`
      INSERT INTO tags (id, name, color, created_at)
      VALUES (?, ?, ?, ?)
    `, [id, name, color, now]);

    return id;
  },

  delete(id) {
    return runDelete('DELETE FROM tags WHERE id = ?', [id]);
  },

  addToTransaction(transactionId, tagId) {
    runInsert('INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)', [transactionId, tagId]);
  },

  removeFromTransaction(transactionId, tagId) {
    runDelete('DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?', [transactionId, tagId]);
  },

  getTransactionTags(transactionId) {
    return runQuery(`
      SELECT t.* FROM tags t
      JOIN transaction_tags tt ON t.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `, [transactionId]);
  }
};

export const settingsService = {
  get(key, defaultValue = null) {
    const results = runQuery('SELECT value FROM app_settings WHERE key = ?', [key]);
    return results[0]?.value ?? defaultValue;
  },

  set(key, value) {
    runInsert('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
  },

  delete(key) {
    runDelete('DELETE FROM app_settings WHERE key = ?', [key]);
  }
};