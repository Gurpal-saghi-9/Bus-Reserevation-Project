/**
 * Authentication middleware for protecting routes
 */

// Check if user is authenticated
const isAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  
  return res.status(401).json({ message: 'Unauthorized access. Please login to continue.' });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};

// Check if user is driver
const isDriver = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'driver') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Driver privileges required.' });
};

// Check if user is admin or driver
const isAdminOrDriver = (req, res, next) => {
  if (req.session && req.session.user && 
      (req.session.user.role === 'admin' || req.session.user.role === 'driver')) {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied. Admin or driver privileges required.' });
};

// Attach user data to request if authenticated
const attachUserData = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

module.exports = {
  isAuth,
  isAdmin,
  isDriver,
  isAdminOrDriver,
  attachUserData
};