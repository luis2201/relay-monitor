const authService = require('./authService');
const userRepository = require('./userRepository');

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    const payload = authService.verifyJwtToken(token);
    const user = await userRepository.findUserById(payload.id);

    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

module.exports = {
  verifyToken
};
