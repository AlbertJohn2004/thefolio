const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth.middleware');
// Note: Ensure your server.js uses these middlewares if you want to lock the door!
const router = express.Router();

// 1. GET ALL USERS (Excluding the current admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. PATCH: TOGGLE ROLE (Make Admin / Make User)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Switch the role
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    
    res.json({ message: `User role is now ${user.role}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE: REMOVE USER PERMANENTLY
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. PUT: TOGGLE STATUS (Active/Inactive)
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin')
      return res.status(404).json({ message: 'User not found' });
    
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();
    res.json({ message: `User is now ${user.status}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. GET ALL POSTS
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. PUT: REMOVE POST
router.put('/posts/:id/remove', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.status = 'removed';
    await post.save();
    res.json({ message: 'Post has been removed', post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;