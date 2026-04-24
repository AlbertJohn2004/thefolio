const express = require('express');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth.middleware'); // Fixed path naming
const { memberOrAdmin } = require('../middleware/role.middleware'); // Fixed path naming
const router = express.Router();

// ── GET /api/comments/:postId ──────────────────────────────────
// Public: Get all comments for a specific post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name profilePic')
      .sort({ createdAt: 1 }); // Oldest first for a natural conversation flow
    res.json(comments);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── POST /api/comments/:postId ─────────────────────────────────
// Protected: Only members or admins can comment
router.post('/:postId', protect, memberOrAdmin, async (req, res) => {
  try {
    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      body: req.body.body,
    });

    // We MUST await populate here so the frontend gets the author's name/pic immediately
    const populatedComment = await comment.populate('author', 'name profilePic');
    
    res.status(201).json(populatedComment);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// ── DELETE /api/comments/:id ───────────────────────────────────
// Protected: Only comment owner OR admin can delete
router.delete('/:id', protect, memberOrAdmin, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = router;