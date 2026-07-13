const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('./userRepository');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ClaveTemporalSegura';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return secret || 'relay_monitor_local_dev_secret';
}

async function ensureAdminUser() {
  const existingAdmin = await userRepository.findUserByUsername(ADMIN_USER);

  if (existingAdmin) {
    await userRepository.updateAdminDefaults({
      id: existingAdmin.id,
      name: ADMIN_NAME,
      role: 'ADMIN',
      active: existingAdmin.active
    });
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await userRepository.createUser({
    name: ADMIN_NAME,
    username: ADMIN_USER,
    passwordHash,
    role: 'ADMIN',
    active: 1
  });

  console.log(`Usuario administrador inicial creado: ${ADMIN_USER}`);
}

async function login({ username, password, ipAddress, userAgent }) {
  const user = await userRepository.findUserByUsername(username);

  if (!user) {
    await userRepository.createAuditLog({
      username,
      action: 'LOGIN_FAILED',
      success: false,
      ipAddress,
      userAgent,
      message: 'Usuario no existe'
    });
    return { status: 'invalid_credentials' };
  }

  if (!user.active) {
    await userRepository.createAuditLog({
      username,
      userId: user.id,
      action: 'USER_DISABLED',
      success: false,
      ipAddress,
      userAgent,
      message: 'Usuario inactivo'
    });
    return { status: 'user_disabled' };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    await userRepository.createAuditLog({
      username,
      userId: user.id,
      action: 'LOGIN_FAILED',
      success: false,
      ipAddress,
      userAgent,
      message: 'Contrasena incorrecta'
    });
    return { status: 'invalid_credentials' };
  }

  const safeUser = userRepository.toSafeUser(user);
  const tokenJti = crypto.randomUUID();
  const token = jwt.sign(
    {
      id: safeUser.id,
      name: safeUser.name,
      username: safeUser.username,
      role: safeUser.role,
      jti: tokenJti
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );

  await userRepository.updateUserLogin(user.id);
  await userRepository.createSession({
    userId: user.id,
    tokenJti,
    ipAddress,
    userAgent,
    expiresAt: null
  });
  await userRepository.createAuditLog({
    username,
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    success: true,
    ipAddress,
    userAgent,
    message: 'Login correcto'
  });

  return {
    status: 'ok',
    token,
    user: safeUser
  };
}

async function logout({ user, tokenJti, ipAddress, userAgent }) {
  if (user?.id && tokenJti) {
    await userRepository.revokeSession({
      userId: user.id,
      tokenJti
    });
  }

  await userRepository.createAuditLog({
    username: user?.username,
    userId: user?.id,
    action: 'LOGOUT',
    success: true,
    ipAddress,
    userAgent,
    message: 'Sesion cerrada'
  });
}

function verifyJwtToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  ensureAdminUser,
  login,
  logout,
  verifyJwtToken
};
