const express = require('express');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth.middleware'); // Fixed naming
const { memberOrAdmin } = require('../middleware/role.middleware'); // Ensure naming matches
const upload = require('../middleware/upload');
const router = express.Router();

// ── GET /api/posts ─────────────────────────────────────────────
// Public: Fetch all published posts (newest first)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'name profilePic')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── GET /api/posts/:id ─────────────────────────────────────────
// Public: Fetch single post by ID
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name profilePic');
    
    // Check if post exists and is not soft-deleted
    if (!post || post.status === 'removed') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── POST /api/posts ────────────────────────────────────────────
// Protected: Only Members or Admins can create
router.post('/', protect, memberOrAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, body } = req.body;
    const image = req.file ? req.file.filename : '';

    const post = await Post.create({ 
      title, 
      body, 
      image, 
      author: req.user._id 
    });

    // Populate author info before sending back to React
    const populatedPost = await post.populate('author', 'name profilePic');
    
    res.status(201).json(populatedPost);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── PUT /api/posts/:id ─────────────────────────────────────────
// Protected: Only owner OR admin can edit
router.put('/:id', protect, memberOrAdmin, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Auth logic: compare IDs as strings
    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    if (req.body.title) post.title = req.body.title;
    if (req.body.body) post.body = req.body.body;
    if (req.file) post.image = req.file.filename;

    await post.save(); // Triggers any pre-save hooks
    res.json(post);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── DELETE /api/posts/:id ──────────────────────────────────────
// Protected: Only owner OR admin can delete
router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isOwner = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = router;