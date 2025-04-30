const express = require('express');
const router = express.Router();
const { eq } = require('drizzle-orm');
const { db, query } = require('../db');
const { users } = require('../shared/schema');
const { hashPassword, comparePassword, sanitizeUser, validateRegistration, validateLogin } = require('../utils/auth');
const { isAuth } = require('../middleware/auth');

/**
 * @route POST /api/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    // Validate registration data
    const validation = validateRegistration(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors.join(', ') });
    }
    
    const { username, email, password, fullName, phone } = req.body;
    
    // Check if user already exists
    const existingUserByUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUserByUsername.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const existingUserByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUserByEmail.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the user
    const role = req.body.role || 'passenger'; // Default role is passenger
    
    // Insert user into database
    const newUser = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      fullName,
      phone,
      role
    }).returning();
    
    // Create session
    req.session.user = sanitizeUser(newUser[0]);
    
    // Return the user without password
    res.status(201).json(sanitizeUser(newUser[0]));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @route POST /api/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate login data
    const validation = validateLogin(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors.join(', ') });
    }
    
    const { username, password } = req.body;
    
    // Find the user
    const userResults = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (userResults.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = userResults[0];
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Create session
    req.session.user = sanitizeUser(user);
    
    // Return the user without password
    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @route POST /api/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
    
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

/**
 * @route GET /api/user
 * @desc Get the current user
 * @access Private
 */
router.get('/user', isAuth, (req, res) => {
  res.status(200).json(req.session.user);
});

/**
 * @route PUT /api/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', isAuth, async (req, res) => {
  try {
    const { email, fullName, phone } = req.body;
    const userId = req.session.user.id;
    
    // Update the user
    const updatedUser = await db.update(users)
      .set({
        email: email || req.session.user.email,
        fullName,
        phone,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update session
    req.session.user = sanitizeUser(updatedUser[0]);
    
    // Return the updated user
    res.status(200).json(sanitizeUser(updatedUser[0]));
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

/**
 * @route PUT /api/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', isAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    // Get the user with password
    const userResults = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResults[0];
    
    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await db.update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;