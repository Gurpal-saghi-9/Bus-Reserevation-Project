const bcrypt = require('bcrypt');

/**
 * Authentication utility functions
 */

// Hash a password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare a password with a hash
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Sanitize user object (remove sensitive data)
const sanitizeUser = (user) => {
  if (!user) return null;
  
  // Create a copy of the user object without the password
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Validate registration data
const validateRegistration = (data) => {
  const errors = [];
  
  // Username validation
  if (!data.username) {
    errors.push('Username is required');
  } else if (data.username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Please provide a valid email address');
    }
  }
  
  // Password validation
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate login data
const validateLogin = (data) => {
  const errors = [];
  
  if (!data.username) {
    errors.push('Username is required');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  sanitizeUser,
  validateRegistration,
  validateLogin
};