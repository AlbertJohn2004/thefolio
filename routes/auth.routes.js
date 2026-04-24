const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload');
const router = express.Router();

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("CRITICAL ERROR: JWT_SECRET is not defined in .env");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ── POST /api/auth/register ───────────────────────────────────
// Added 'next' here ---------------------------------------v
router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email is already registered' });

    const user = await User.create({ name, email, password });
    
    res.status(201).json({
      token: generateToken(user._id),
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { 
    // Instead of res.status, use next(err) to let Express handle it properly
    next(err); 
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account is deactivated.' });
    }

    const match = await user.matchPassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({
      token: generateToken(user._id),
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        profilePic: user.profilePic 
      }
    });
  } catch (err) { 
    next(err); 
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put('/profile', protect, upload.single('profilePic'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (req.body.name) user.name = req.body.name;
    if (req.body.bio) user.bio = req.body.bio;
    if (req.file) user.profilePic = req.file.filename;

    await user.save();
    
    const updated = await User.findById(user._id).select('-password');
    res.json(updated);
  } catch (err) { 
    next(err); 
  }
});

// ── PUT /api/auth/change-password ────────────────────────────
router.put('/change-password', protect, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    const match = await user.matchPassword(currentPassword);

    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword; 
    await user.save(); 
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) { 
    next(err); 
  }
});

module.exports = router;  