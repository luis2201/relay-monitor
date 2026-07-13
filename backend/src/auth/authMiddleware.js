const authService = require('./authService');
const userRepository = require('./userRepository');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Token requerido' });
    return;
  }

  try {
    const payload = authService.verifyJwtToken(token);
    const user = await userRepository.findUserById(payload.id);

    if (!user) {
      await logInvalidToken(req, payload, 'Usuario no existe');
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    if (!user.active) {
      await userRepository.createAuditLog({
        username: user.username,
        userId: user.id,
        action: 'USER_DISABLED',
        success: false,
        ipAddress: getIpAddress(req),
        userAgent: req.headers['user-agent'],
        message: 'Usuario inactivo'
      });
      res.status(403).json({ message: 'Usuario inactivo' });
      return;
    }

    req.user = userRepository.toSafeUser(user);
    req.tokenJti = payload.jti;
    next();
  } catch (error) {
    await logInvalidToken(req, null, error.message);
    res.status(401).json({ message: 'Token inválido' });
  }
}

async function logInvalidToken(req, payload, message) {
  await userRepository.createAuditLog({
    username: payload?.username,
    userId: payload?.id,
    action: 'TOKEN_INVALID',
    success: false,
    ipAddress: getIpAddress(req),
    userAgent: req.headers['user-agent'],
    message
  });
}

function getIpAddress(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
}

module.exports = {
  verifyToken,
  getIpAddress
};
