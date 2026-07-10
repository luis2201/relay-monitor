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

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database has not been initialized');
  }

  return { run, all };
}

module.exports = {
  initDb,
  getDb
};
