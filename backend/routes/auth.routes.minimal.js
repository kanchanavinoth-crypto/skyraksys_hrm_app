const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');

const User = db.User;
const router = express.Router();

// Simple JWT token generation
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'skyraksys_jwt_secret_key_2024_development',
    { expiresIn: '24h' }
  );
};

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password (simplified query)
    const user = await User.scope('withPassword').findOne({ 
      where: { 
        email: email.toLowerCase(), 
        isActive: true 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate access token only (simplified)
    const accessToken = generateAccessToken(user);

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          uuid: user.uuid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      },
      // For compatibility with existing tests
      token: accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

module.exports = router;
