import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'QP Repository Workflow System API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;

