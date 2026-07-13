require('dotenv').config();

const bcrypt = require('bcryptjs');
const { initDb } = require('../src/db');
const userRepository = require('../src/auth/userRepository');

const DEFAULT_ROLE = 'ADMIN';

async function main() {
  const name = process.env.USER_NAME || process.env.ADMIN_NAME || 'Administrador';
  const username = process.env.USER_USERNAME || process.env.ADMIN_USER || 'admin';
  const password = process.env.USER_PASSWORD || process.env.ADMIN_PASSWORD;
  const role = normalizeRole(process.env.USER_ROLE || DEFAULT_ROLE);

  if (!username || !password) {
    throw new Error('USER_USERNAME and USER_PASSWORD are required');
  }

  await initDb();

  const passwordHash = await bcrypt.hash(password, 12);
  const existingUser = await userRepository.findUserByUsername(username);

  if (existingUser) {
    await userRepository.updateUserCredentials({
      id: existingUser.id,
      name,
      passwordHash,
      role,
      active: 1
    });

    console.log(`Usuario actualizado: ${username} (${role})`);
    return;
  }

  await userRepository.createUser({
    name,
    username,
    passwordHash,
    role,
    active: 1
  });

  console.log(`Usuario creado: ${username} (${role})`);
}

function normalizeRole(role) {
  const normalizedRole = String(role || DEFAULT_ROLE).toUpperCase();

  if (!['ADMIN', 'MONITOR'].includes(normalizedRole)) {
    throw new Error('USER_ROLE must be ADMIN or MONITOR');
  }

  return normalizedRole;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
