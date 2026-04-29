require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// 1. Connect to MongoDB
connectDB(); 

// 2. ── Middleware ─────────────────────────────────────────────────

// FIXED: Allow all origins (*) so Vercel can communicate with Render
// Also added specific options to handle the "preflight" requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Serve uploaded image files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// 4. ── Health Check (To test if the server is awake) ──────────────
app.get('/', (req, res) => {
    res.send('API is running successfully...');
});

// 5. ── Start Server ──────────────────────────────────────────────
// Render provides the PORT automatically through process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});