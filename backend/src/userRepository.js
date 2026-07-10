const { getDb } = require('./db');

async function findUserByUsername(username) {
  const db = getDb();

  return db.get(
    `
      SELECT id, username, password_hash, role, created_at
      FROM users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );
}

async function findUserById(id) {
  const db = getDb();

  return db.get(
    `
      SELECT id, username, role, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
}

async function countUsers() {
  const db = getDb();
  const row = await db.get('SELECT COUNT(*) AS count FROM users');
  return Number(row.count);
}

async function createUser({ username, passwordHash, role = 'admin' }) {
  const db = getDb();

  const result = await db.run(
    `
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `,
    [username, passwordHash, role]
  );

  return {
    id: result.id,
    username,
    role
  };
}

module.exports = {
  findUserByUsername,
  findUserById,
  countUsers,
  createUser
};
