import express from 'express';
import {
    // Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    grantPrivilege,
    revokePrivilege,
    // Sessions
    getSessions,
    createSession,
    updateSession,
    deleteSession,
    // Departments
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    // Courses
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    // Course Role Mapping
    getCourseRoleMappings,
    saveCourseRoleMapping,
    deleteCourseRoleMapping,
    // Audit Logs
    getAuditLogs
} from '../controllers/adminController.js';
import { authenticate, hasPrivilege } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and ADMIN privilege
router.use(authenticate);
router.use(hasPrivilege('ADMIN'));

// User management routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/privileges', grantPrivilege);
router.delete('/users/:id/privileges/:privilege', revokePrivilege);

// Session management routes
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.put('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);

// Department management routes
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Course management routes
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Course role mapping routes
router.get('/course-roles', getCourseRoleMappings);
router.post('/course-roles', saveCourseRoleMapping);
router.delete('/course-roles/:id', deleteCourseRoleMapping);

// Audit log routes
router.get('/audit-logs', getAuditLogs);

export default router;

