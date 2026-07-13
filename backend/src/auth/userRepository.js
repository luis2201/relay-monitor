const { getDb } = require('../db');

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active
  };
}

async function findUserByUsername(username) {
  const db = getDb();

  return db.get(
    `
      SELECT id, name, username, password_hash, role, active, last_login_at, created_at, updated_at
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
      SELECT id, name, username, role, active, last_login_at, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );
}

async function createUser({ name, username, passwordHash, role = 'ADMIN', active = 1 }) {
  const db = getDb();

  const result = await db.run(
    `
      INSERT INTO users (name, username, password_hash, role, active)
      VALUES (?, ?, ?, ?, ?)
    `,
    [name, username, passwordHash, role, active]
  );

  return {
    id: result.id,
    name,
    username,
    role,
    active
  };
}

async function updateUserLogin(userId) {
  const db = getDb();

  await db.run(
    `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [userId]
  );
}

async function updateAdminDefaults({ id, name, role = 'ADMIN', active = 1 }) {
  const db = getDb();

  await db.run(
    `
      UPDATE users
      SET name = COALESCE(NULLIF(name, ''), ?),
          role = ?,
          active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [name, role, active, id]
  );
}

async function createAuditLog({
  username = null,
  userId = null,
  action,
  success = false,
  ipAddress = null,
  userAgent = null,
  message = null
}) {
  const db = getDb();

  await db.run(
    `
      INSERT INTO auth_audit_log (
        username,
        user_id,
        action,
        success,
        ip_address,
        user_agent,
        message
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [username, userId, action, success ? 1 : 0, ipAddress, userAgent, message]
  );
}

async function createSession({ userId, tokenJti, ipAddress = null, userAgent = null, expiresAt = null }) {
  const db = getDb();

  await db.run(
    `
      INSERT INTO user_sessions (user_id, token_jti, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId, tokenJti, ipAddress, userAgent, expiresAt]
  );
}

async function revokeSession({ userId, tokenJti }) {
  const db = getDb();

  await db.run(
    `
      UPDATE user_sessions
      SET active = 0,
          revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND token_jti = ?
        AND active = 1
    `,
    [userId, tokenJti]
  );
}

module.exports = {
  toSafeUser,
  findUserByUsername,
  findUserById,
  createUser,
  updateUserLogin,
  updateAdminDefaults,
  createAuditLog,
  createSession,
  revokeSession
};
