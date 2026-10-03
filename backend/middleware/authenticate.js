const { verifyToken } = require('../utils/tokens');

const readBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header) return { error: 'Authorization header missing' };
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return { error: 'Invalid authorization format' };
  return { token: parts[1] };
};

// Requires a valid token.
const authenticate = (req, res, next) => {
  const { token, error } = readBearerToken(req);
  if (error) return res.status(401).json({ error });
  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Requires a valid token that belongs to an administrator.
const requireAdmin = (req, res, next) =>
  authenticate(req, res, () => {
    // Tokens issued before roles existed carry no role claim: force a fresh login.
    if (!req.user.role) return res.status(401).json({ error: 'Session expired, please log in again' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    return next();
  });

// Attaches req.user when a valid token is present but never rejects the request.
const optionalAuth = (req, res, next) => {
  const { token } = readBearerToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch (err) {
      req.user = undefined;
    }
  }
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
