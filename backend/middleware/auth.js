const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT from Authorization: Bearer <token> header.
 * Attaches req.user on success.
 */
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised – no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user (without password) to request
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Factory: allow only certain roles.
 * Usage: restrictTo('admin', 'doctor')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' does not have access to this resource`,
      });
    }
    next();
  };
}

module.exports = { protect, restrictTo };
