import initSqlJs from 'sql.js';

let db = null;

const DB_NAME = 'finansapp_db';

const schema = `
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    bank_name TEXT,
    iban TEXT,
    initial_balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'TRY',
    color TEXT DEFAULT '#0ea5e9',
    icon TEXT DEFAULT 'wallet',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#10b981',
    monthly_limit REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag',
    color TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'TRY',
    date TEXT NOT NULL,
    time TEXT,
    category_id TEXT,
    subcategory_id TEXT,
    description TEXT,
    payment_method TEXT DEFAULT 'cash',
    account_id TEXT,
    to_account_id TEXT,
    status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'pending', 'scheduled')),
    installment_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (transaction_id, tag_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    period TEXT DEFAULT 'monthly' CHECK(period IN ('weekly', 'monthly')),
    start_date TEXT,
    end_date TEXT,
    warning_threshold REAL DEFAULT 80,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_amount REAL NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    remaining_amount REAL NOT NULL,
    monthly_payment REAL NOT NULL,
    first_payment_date TEXT NOT NULL,
    last_payment_date TEXT,
    payment_day INTEGER DEFAULT 1,
    account_id TEXT,
    category_id TEXT,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'overdue')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS installment_payments (
    id TEXT PRIMARY KEY,
    installment_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    is_paid INTEGER DEFAULT 0,
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    person_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('debt', 'receivable')),
    amount REAL NOT NULL,
    remaining_amount REAL NOT NULL,
    due_date TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('paid', 'pending', 'overdue')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    installment_id TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id TEXT PRIMARY KEY,
    transaction_template TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_date TEXT NOT NULL,
    end_date TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date TEXT,
    icon TEXT DEFAULT 'target',
    color TEXT DEFAULT '#10b981',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_date TEXT NOT NULL,
    category_id TEXT,
    account_id TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('budget_warning', 'budget_overflow', 'upcoming_payment', 'debt_due', 'anomaly', 'subscription_due', 'general')),
    title TEXT NOT NULL,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS anomalies (
    id TEXT PRIMARY KEY,
    transaction_id TEXT,
    category_id TEXT,
    expected_amount REAL,
    actual_amount REAL,
    deviation_percent REAL,
    is_resolved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
`;

const defaultCategories = [
  { id: 'cat_income_salary', name: 'Maaş', type: 'income', icon: 'briefcase', color: '#10b981' },
  { id: 'cat_income_freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#22c55e' },
  { id: 'cat_income_interest', name: 'Faiz', type: 'income', icon: 'percent', color: '#84cc16' },
  { id: 'cat_income_rent', name: 'Kira Geliri', type: 'income', icon: 'home', color: '#eab308' },
  { id: 'cat_income_bonus', name: 'Prim', type: 'income', icon: 'gift', color: '#f97316' },
  { id: 'cat_income_sales', name: 'Satış', type: 'income', icon: 'shopping-cart', color: '#ef4444' },
  { id: 'cat_income_investment', name: 'Yatırım Kazancı', type: 'income', icon: 'trending-up', color: '#ec4899' },
  { id: 'cat_expense_grocery', name: 'Market', type: 'expense', icon: 'shopping-bag', color: '#f43f5e' },
  { id: 'cat_expense_transport', name: 'Ulaşım', type: 'expense', icon: 'car', color: '#fb923c' },
  { id: 'cat_expense_bills', name: 'Fatura', type: 'expense', icon: 'zap', color: '#facc15' },
  { id: 'cat_expense_health', name: 'Sağlık', type: 'expense', icon: 'heart', color: '#22c55e' },
  { id: 'cat_expense_entertainment', name: 'Eğlence', type: 'expense', icon: 'film', color: '#a855f7' },
  { id: 'cat_expense_food', name: 'Yemek', type: 'expense', icon: 'coffee', color: '#f97316' },
  { id: 'cat_expense_education', name: 'Eğitim', type: 'expense', icon: 'book', color: '#3b82f6' },
  { id: 'cat_expense_rent', name: 'Kira', type: 'expense', icon: 'home', color: '#6366f1' },
  { id: 'cat_expense_tax', name: 'Vergi', type: 'expense', icon: 'file-text', color: '#8b5cf6' },
  { id: 'cat_expense_tech', name: 'Teknoloji', type: 'expense', icon: 'smartphone', color: '#06b6d4' },
];

const defaultAccounts = [
  { id: 'acc_cash', name: 'Nakit', type: 'cash', initial_balance: 5000, color: '#10b981' },
  { id: 'acc_garanti', name: 'Garanti Bank', type: 'bank', bank_name: 'Garanti BBVA', iban: 'TR12 3456 7890 1234 5678 9012 34', initial_balance: 25000, color: '#f59e0b' },
  { id: 'acc_akbank', name: 'Akbank Kredi Kartı', type: 'credit_card', bank_name: 'Akbank', initial_balance: -5000, color: '#ef4444' },
  { id: 'acc_koin', name: 'Kripto Cüzdan', type: 'crypto', initial_balance: 10000, color: '#8b5cf6' },
  { id: 'acc_yapi', name: 'Yapı Kredi Yatırım', type: 'investment', bank_name: 'Yapı Kredi', initial_balance: 50000, color: '#3b82f6' },
];

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: () => `${window.location.origin}/sql-wasm.wasm`
  });

  const savedDb = localStorage.getItem(DB_NAME);
  const isFirstLaunch = localStorage.getItem('finansapp_first_launch');

  if (savedDb && isFirstLaunch === 'false') {
    const data = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
    db = new SQL.Database(data);
    migrateDatabase();
  } else {
    db = new SQL.Database();
    db.run(schema);
    if (isFirstLaunch !== 'false') {
      seedDefaultData();
      localStorage.setItem('finansapp_first_launch', 'true');
    }
  }

  return db;
}

function migrateDatabase() {
  const tableChecks = {
    savings_goals: `CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT,
      icon TEXT DEFAULT 'target',
      color TEXT DEFAULT '#10b981',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    subscriptions: `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      next_date TEXT NOT NULL,
      category_id TEXT,
      account_id TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )`,
    notifications: `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('budget_warning', 'budget_overflow', 'upcoming_payment', 'debt_due', 'anomaly', 'subscription_due', 'general')),
      title TEXT NOT NULL,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    anomalies: `CREATE TABLE IF NOT EXISTS anomalies (
      id TEXT PRIMARY KEY,
      transaction_id TEXT,
      category_id TEXT,
      expected_amount REAL,
      actual_amount REAL,
      deviation_percent REAL,
      is_resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )`
  };

  Object.values(tableChecks).forEach(sql => {
    db.run(sql);
  });

  saveDatabase();
}

async function seedDefaultData() {
  defaultCategories.forEach(cat => {
    db.run(
      'INSERT INTO categories (id, name, type, icon, color, monthly_limit) VALUES (?, ?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.type === 'expense' ? 5000 : null]
    );
  });

  defaultAccounts.forEach(acc => {
    db.run(
      'INSERT INTO accounts (id, name, type, bank_name, iban, initial_balance, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [acc.id, acc.name, acc.type, acc.bank_name || null, acc.iban || null, acc.initial_balance, acc.color, acc.type === 'cash' ? 'wallet' : acc.type === 'bank' ? 'building' : acc.type === 'credit_card' ? 'credit-card' : acc.type === 'crypto' ? 'bitcoin' : 'trending-up']
    );
  });

  saveDatabase();
}

export function saveDatabase() {
  if (!db) return;
  const data = db.export();
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  localStorage.setItem(DB_NAME, btoa(binary));
}

export function getDatabase() {
  return db;
}

export function runQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  const cleanParams = params.map(p => p === undefined ? null : p);
  stmt.bind(cleanParams);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function runInsert(sql, params = []) {
  const cleanParams = params.map(p => p === undefined ? null : p);
  db.run(sql, cleanParams);
  saveDatabase();
  return db.getRowsModified() > 0;
}

export function runUpdate(sql, params = []) {
  const cleanParams = params.map(p => p === undefined ? null : p);
  db.run(sql, cleanParams);
  saveDatabase();
  return db.getRowsModified() > 0;
}

export function runDelete(sql, params = []) {
  const cleanParams = params.map(p => p === undefined ? null : p);
  db.run(sql, cleanParams);
  saveDatabase();
  return db.getRowsModified() > 0;
}

export function getLastInsertId() {
  const result = runQuery('SELECT last_insert_rowid() as id');
  return result[0]?.id;
}

export function clearAllData() {
  if (!db) return;

  try {
    db.run('DELETE FROM transaction_tags');
    db.run('DELETE FROM transactions');
    db.run('DELETE FROM installment_payments');
    db.run('DELETE FROM installments');
    db.run('DELETE FROM debts');
    db.run('DELETE FROM budgets');
    db.run('DELETE FROM subcategories');
    db.run('DELETE FROM categories');
    db.run('DELETE FROM accounts');
    db.run('DELETE FROM tags');
    db.run('DELETE FROM attachments');
    db.run('DELETE FROM recurring_transactions');
    saveDatabase();
    localStorage.removeItem(DB_NAME);
    localStorage.setItem('finansapp_first_launch', 'false');
  } catch (e) {
    console.error('Error clearing data:', e);
  }
}

export function exportDatabase() {
  return localStorage.getItem(DB_NAME);
}

export function importDatabase(base64Data) {
  const data = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const SQL = db.constructor;
  db = new SQL.Database(data);
  saveDatabase();
  return true;
}

export function hasData() {
  if (!db) return false;
  const result = runQuery('SELECT COUNT(*) as count FROM transactions');
  return result[0]?.count > 0;
}

export function seedDemoData() {
  if (hasData()) return;

  console.log('Seeding demo data...');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const demoTransactions = [
    { type: 'income', amount: 45000, category: 'cat_income_salary', account: 'acc_garanti', description: 'Maaş', day: 5 },
    { type: 'expense', amount: 3500, category: 'cat_expense_rent', account: 'acc_garanti', description: 'Kira', day: 1 },
    { type: 'expense', amount: 850, category: 'cat_expense_grocery', account: 'acc_garanti', description: 'BİM Market', day: 3 },
    { type: 'expense', amount: 420, category: 'cat_expense_transport', account: 'acc_cash', description: 'Otomobil yakıt', day: 7 },
    { type: 'expense', amount: 250, category: 'cat_expense_bills', account: 'acc_garanti', description: 'Elektrik faturası', day: 10 },
    { type: 'expense', amount: 180, category: 'cat_expense_bills', account: 'acc_garanti', description: 'Doğalgaz faturası', day: 12 },
    { type: 'expense', amount: 150, category: 'cat_expense_bills', account: 'acc_garanti', description: 'İnternet faturası', day: 15 },
    { type: 'expense', amount: 650, category: 'cat_expense_food', account: 'acc_akbank', description: 'Restoran', day: 8 },
    { type: 'expense', amount: 320, category: 'cat_expense_entertainment', account: 'acc_cash', description: 'Sinema ve konser', day: 14 },
    { type: 'expense', amount: 1200, category: 'cat_expense_tech', account: 'acc_akbank', description: 'Elektronik', day: 20 },
    { type: 'income', amount: 5000, category: 'cat_income_freelance', account: 'acc_garanti', description: 'Freelance proje', day: 18 },
    { type: 'expense', amount: 280, category: 'cat_expense_health', account: 'acc_cash', description: 'Eczane', day: 22 },
    { type: 'expense', amount: 1500, category: 'cat_expense_education', account: 'acc_garanti', description: 'Online kurs', day: 25 },
    { type: 'expense', amount: 400, category: 'cat_expense_grocery', account: 'acc_cash', description: 'A101 Market', day: 17 },
    { type: 'expense', amount: 220, category: 'cat_expense_transport', account: 'acc_cash', description: 'Uber', day: 19 },
    { type: 'income', amount: 2000, category: 'cat_income_bonus', account: 'acc_garanti', description: 'Performans bonusu', day: 28 },
    { type: 'expense', amount: 750, category: 'cat_expense_food', account: 'acc_akbank', description: 'Yemek siparişi', day: 21 },
    { type: 'expense', amount: 180, category: 'cat_expense_bills', account: 'acc_garanti', description: 'Telefon faturası', day: 23 },
    { type: 'transfer', amount: 2000, account: 'acc_garanti', to_account: 'acc_yapi', description: 'Yatırım transfer', day: 26 },
    { type: 'expense', amount: 550, category: 'cat_expense_grocery', account: 'acc_garanti', description: 'Migros', day: 27 },
  ];

  const endDay = new Date(currentYear, currentMonth, 0).getDate();

  demoTransactions.forEach((tx) => {
    const day = Math.min(tx.day + Math.floor(Math.random() * 3) - 1, endDay);
    const date = new Date(currentYear, currentMonth - 1, day);
    const time = `${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const id = generateUUID();
    const createdAt = now.toISOString();
    const amount = tx.amount * (0.8 + Math.random() * 0.4);

    db.run(`
      INSERT INTO transactions (id, type, amount, currency, date, time, category_id, account_id, to_account_id, description, payment_method, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, tx.type, amount, 'TRY',
      date.toISOString().split('T')[0], time,
      tx.category, tx.account, tx.to_account || null, tx.description,
      tx.type === 'expense' ? (Math.random() > 0.5 ? 'card' : 'cash') : 'bank_transfer',
      'paid', createdAt, createdAt,
    ]);
  });

  for (let i = 1; i <= 2; i++) {
    const prevMonth = new Date(currentYear, currentMonth - 2, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth - 1, 0);
    const prevEndDay = prevMonthEnd.getDate();

    demoTransactions.forEach((tx) => {
      const day = Math.min(tx.day + Math.floor(Math.random() * 3) - 1, prevEndDay);
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day);
      const time = `${String(8 + Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      const id = generateUUID();
      const createdAt = now.toISOString();
      const amount = tx.amount * (0.8 + Math.random() * 0.4);

      db.run(`
        INSERT INTO transactions (id, type, amount, currency, date, time, category_id, account_id, to_account_id, description, payment_method, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, tx.type, amount, 'TRY',
        date.toISOString().split('T')[0], time,
        tx.category, tx.account, tx.to_account || null, tx.description,
        tx.type === 'expense' ? (Math.random() > 0.5 ? 'card' : 'cash') : 'bank_transfer',
        'paid', createdAt, createdAt,
      ]);
    });
  }

  const installmentId = generateUUID();
  db.run(`
    INSERT INTO installments (id, name, total_amount, total_installments, paid_installments, remaining_amount, monthly_payment, first_payment_date, last_payment_date, payment_day, account_id, category_id, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    installmentId, 'MacBook Pro 16"', 120000, 12, 3, 90000, 10000,
    new Date(currentYear, currentMonth - 3, 15).toISOString().split('T')[0],
    new Date(currentYear, currentMonth + 8, 15).toISOString().split('T')[0],
    15, 'acc_akbank', 'cat_expense_tech', 'Apple Store taksitli alışveriş', 'active',
    now.toISOString(),
  ]);

  for (let i = 0; i < 12; i++) {
    const paymentDate = new Date(currentYear, currentMonth - 3 + i, 15);
    db.run(`
      INSERT INTO installment_payments (id, installment_id, amount, payment_date, due_date, is_paid)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [generateUUID(), installmentId, 10000, paymentDate.toISOString().split('T')[0], paymentDate.toISOString().split('T')[0], i < 3 ? 1 : 0]);
  }

  db.run(`
    INSERT INTO debts (id, person_name, type, amount, remaining_amount, due_date, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    generateUUID(), 'Mehmet Kaya', 'debt', 15000, 10000,
    new Date(currentYear, currentMonth + 1, 20).toISOString().split('T')[0],
    'İşyeri ekipman alımı', 'pending', now.toISOString(), now.toISOString(),
  ]);

  db.run(`
    INSERT INTO debts (id, person_name, type, amount, remaining_amount, due_date, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    generateUUID(), 'Ayşe Demir', 'receivable', 5000, 3500,
    new Date(currentYear, currentMonth, 10).toISOString().split('T')[0],
    'Freelance proje ödemesi', 'pending', now.toISOString(), now.toISOString(),
  ]);

  db.run(`
    INSERT INTO budgets (id, category_id, amount, period, warning_threshold, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['budget_grocery', 'cat_expense_grocery', 5000, 'monthly', 80, now.toISOString()]);

  db.run(`
    INSERT INTO budgets (id, category_id, amount, period, warning_threshold, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['budget_food', 'cat_expense_food', 3000, 'monthly', 80, now.toISOString()]);

  db.run(`
    INSERT INTO budgets (id, category_id, amount, period, warning_threshold, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['budget_transport', 'cat_expense_transport', 1500, 'monthly', 80, now.toISOString()]);

  saveDatabase();
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}