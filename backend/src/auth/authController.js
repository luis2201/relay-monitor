const authService = require('./authService');
const { getIpAddress } = require('./authMiddleware');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
      return;
    }

    const result = await authService.login({
      username,
      password,
      ipAddress: getIpAddress(req),
      userAgent: req.headers['user-agent']
    });

    if (result.status === 'user_disabled') {
      res.status(403).json({ message: 'Usuario inactivo' });
      return;
    }

    if (result.status !== 'ok') {
      res.status(401).json({ message: 'Credenciales incorrectas' });
      return;
    }

    res.json({
      token: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({
    user: req.user
  });
}

async function logout(req, res, next) {
  try {
    await authService.logout({
      user: req.user,
      tokenJti: req.tokenJti,
      ipAddress: getIpAddress(req),
      userAgent: req.headers['user-agent']
    });

    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
  logout
};
