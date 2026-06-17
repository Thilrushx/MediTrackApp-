const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'meditrack_dev_secret_change_in_prod';

/**
 * Verifies the JWT in the Authorization header.
 * On success, attaches req.user = { id, email, role, name, patientId? }
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.slice(7); // strip "Bearer "
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Please log in again.' });
  }
};

/**
 * Role-based access guard. Pass one or more allowed roles.
 * Must be used AFTER verifyToken.
 *
 * Usage:  router.get('/admin', verifyToken, requireRole('doctor'), handler)
 *         router.get('/shared', verifyToken, requireRole('doctor', 'caregiver'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
    });
  }
  next();
};

module.exports = { verifyToken, requireRole };
