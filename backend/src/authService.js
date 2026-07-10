const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('./userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'relay_monitor_local_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ClaveTemporalSegura';

async function ensureAdminUser() {
  const usersCount = await userRepository.countUsers();

  if (usersCount > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await userRepository.createUser({
    username: ADMIN_USER,
    passwordHash,
    role: 'admin'
  });

  console.log(`Usuario administrador inicial creado: ${ADMIN_USER}`);
}

async function login(username, password) {
  const user = await userRepository.findUserByUsername(username);

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return null;
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(safeUser, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return {
    token,
    user: safeUser,
    expiresIn: JWT_EXPIRES_IN
  };
}

function verifyJwtToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  ensureAdminUser,
  login,
  verifyJwtToken
};
