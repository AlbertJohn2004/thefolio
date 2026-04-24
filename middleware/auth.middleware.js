const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for 'Authorization: Bearer <token>' in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. If no token found, stop immediately
  if (!token) {
    return res.status(401).json({ message: 'Not authorized — please log in first' });
  }

  try {
    // 3. Verify the token
    // Ensure JWT_SECRET exists in your .env file!
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach user to request, excluding sensitive password
    req.user = await User.findById(decoded.id).select('-password');

    // 5. Check if user still exists or is active
    if (!req.user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    if (req.user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // 6. Grant access to the next middleware or controller
    next();
  } catch (err) {
    // Specific error messages help frontend developers debug
    const message = err.name === 'TokenExpiredError' 
      ? 'Your session has expired. Please log in again.' 
      : 'Token is invalid';
      
    return res.status(401).json({ message });
  }
};

module.exports = { protect };