import express from 'express';
import { getSessions, getDepartments, getCourses } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes - require authentication but not admin privileges
// These are read-only endpoints for sessions, departments, and courses

router.use(authenticate); // Require login, but not admin

// Get active sessions (for dropdowns in forms)
router.get('/sessions', getSessions);

// Get active departments (for dropdowns in forms)
router.get('/departments', getDepartments);

// Get active courses (for dropdowns in forms)
router.get('/courses', getCourses);

export default router;

