const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || './data/relay-monitor.sqlite';

let db;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

async function initDb() {
  db = new sqlite3.Database(DB_PATH);

  await run(`
    CREATE TABLE IF NOT EXISTS smtp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      occurred_at TEXT,
      queue_id TEXT,
      recipient TEXT,
      relay TEXT,
      status TEXT NOT NULL,
      dsn TEXT,
      delay REAL,
      smtp_response TEXT,
      raw_log TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run('CREATE INDEX IF NOT EXISTS idx_smtp_events_status ON smtp_events(status)');
  await run('CREATE INDEX IF NOT EXISTS idx_smtp_events_occurred_at ON smtp_events(occurred_at)');

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('users', 'name', "TEXT NOT NULL DEFAULT 'Administrador'");
  await ensureColumn('users', 'active', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('users', 'last_login_at', 'TEXT NULL');
  await ensureColumn('users', 'updated_at', 'TEXT NULL');
  await run("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
  await run("UPDATE users SET role = UPPER(role), updated_at = CURRENT_TIMESTAMP WHERE role != UPPER(role)");

  await run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');

  await run(`
    CREATE TABLE IF NOT EXISTS auth_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NULL,
      user_id INTEGER NULL,
      action TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 0,
      ip_address TEXT NULL,
      user_agent TEXT NULL,
      message TEXT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_jti TEXT NULL,
      ip_address TEXT NULL,
      user_agent TEXT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NULL,
      revoked_at TEXT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  return db;
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized');
  }

  return { run, all, get };
}

module.exports = {
  initDb,
  getDb
};
