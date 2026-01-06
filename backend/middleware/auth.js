import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const [users] = await pool.query(
            'SELECT id, name, email FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token. User not found.' });
        }

        // Get user privileges
        const [privileges] = await pool.query(
            'SELECT privilege FROM user_privileges WHERE user_id = ? AND active = TRUE',
            [decoded.userId]
        );

        req.user = {
            ...users[0],
            privileges: privileges.map(p => p.privilege)
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        return res.status(500).json({ error: 'Server error during authentication.' });
    }
};

// Check if user has specific privilege
export const hasPrivilege = (privilege) => {
    return (req, res, next) => {
        if (!req.user.privileges.includes(privilege)) {
            return res.status(403).json({ 
                error: `Access denied. ${privilege} privilege required.` 
            });
        }
        next();
    };
};

// Check if user is coordinator for specific course
export const isCoordinatorForCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.body.courseId;
        
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID required.' });
        }

        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND coordinator_user_id = ? AND active = TRUE',
            [courseId, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ 
                error: 'Access denied. You are not the coordinator for this course.' 
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Server error checking coordinator status.' });
    }
};

// Check if user is deputy dean for specific course
export const isDeputyDeanForCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.body.courseId;
        
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID required.' });
        }

        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND deputy_dean_user_id = ? AND active = TRUE',
            [courseId, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ 
                error: 'Access denied. You are not the deputy dean for this course.' 
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: 'Server error checking deputy dean status.' });
    }
};

