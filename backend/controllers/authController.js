import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = users[0];

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Get user privileges
        const [privileges] = await pool.query(
            'SELECT privilege FROM user_privileges WHERE user_id = ? AND active = TRUE',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [user.id, 'LOGIN', 'user', user.id]
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                privileges: privileges.map(p => p.privilege)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};

// Get current user info
export const getMe = async (req, res) => {
    try {
        // req.user is set by authenticate middleware
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Server error getting user info.' });
    }
};

// Logout (client-side token removal, but we log it)
export const logout = async (req, res) => {
    try {
        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'LOGOUT', 'user', req.user.id]
        );

        res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout.' });
    }
};

