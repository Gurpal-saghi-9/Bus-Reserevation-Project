const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { users } = require('../shared/schema');
const { isAuthenticated } = require('../middleware/auth');
const { eq } = require('drizzle-orm');
const { hashPassword, verifyPassword } = require('../utils/auth');

// Get user profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get user profile without password
    const [userProfile] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId));
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { email, fullName, phone } = req.body;
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Update user profile
    const [updatedProfile] = await db.update(users)
      .set({ 
        email,
        fullName: fullName || '',
        phone: phone || '',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        role: users.role
      });
    
    // Update session with the new data
    req.session.user = updatedProfile;
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating profile',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Get user with password
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while changing password',
      error: error.message
    });
  }
});

module.exports = router;