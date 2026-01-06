import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';

// ===================================
// USER MANAGEMENT
// ===================================

// Get all users
export const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.email, u.created_at,
                   GROUP_CONCAT(DISTINCT up.privilege) as privileges
            FROM users u
            LEFT JOIN user_privileges up ON u.id = up.user_id AND up.active = TRUE
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            users: users.map(u => ({
                ...u,
                privileges: u.privileges ? u.privileges.split(',') : []
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error getting users.' });
    }
};

// Create user
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if email already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'USER_CREATED', 'user', result.insertId, JSON.stringify({ name, email })]
        );

        res.status(201).json({
            success: true,
            userId: result.insertId,
            message: 'User created successfully.'
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Server error creating user.' });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required.' });
        }

        // Check if email already exists (excluding current user)
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already exists.' });
        }

        let query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
        let params = [name, email, id];

        // If password is provided, update it too
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?';
            params = [name, email, hashedPassword, id];
        }

        await pool.query(query, params);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'USER_UPDATED', 'user', id, JSON.stringify({ name, email })]
        );

        res.json({
            success: true,
            message: 'User updated successfully.'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error updating user.' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete yourself.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'USER_DELETED', 'user', id]
        );

        res.json({
            success: true,
            message: 'User deleted successfully.'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error deleting user.' });
    }
};

// Grant privilege
export const grantPrivilege = async (req, res) => {
    try {
        const { id } = req.params;
        const { privilege } = req.body;

        if (!['COORDINATOR', 'DEPUTY_DEAN', 'ADMIN'].includes(privilege)) {
            return res.status(400).json({ error: 'Invalid privilege.' });
        }

        await pool.query(`
            INSERT INTO user_privileges (user_id, privilege, active)
            VALUES (?, ?, TRUE)
            ON DUPLICATE KEY UPDATE active = TRUE
        `, [id, privilege]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'PRIVILEGE_GRANTED', 'user', id, JSON.stringify({ privilege })]
        );

        res.json({
            success: true,
            message: `${privilege} privilege granted successfully.`
        });
    } catch (error) {
        console.error('Grant privilege error:', error);
        res.status(500).json({ error: 'Server error granting privilege.' });
    }
};

// Revoke privilege
export const revokePrivilege = async (req, res) => {
    try {
        const { id, privilege } = req.params;

        await pool.query(
            'UPDATE user_privileges SET active = FALSE WHERE user_id = ? AND privilege = ?',
            [id, privilege]
        );

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'PRIVILEGE_REVOKED', 'user', id, JSON.stringify({ privilege })]
        );

        res.json({
            success: true,
            message: `${privilege} privilege revoked successfully.`
        });
    } catch (error) {
        console.error('Revoke privilege error:', error);
        res.status(500).json({ error: 'Server error revoking privilege.' });
    }
};

// ===================================
// SESSION MANAGEMENT
// ===================================

export const getSessions = async (req, res) => {
    try {
        const [sessions] = await pool.query('SELECT * FROM sessions ORDER BY created_at DESC');
        res.json({ success: true, sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Server error getting sessions.' });
    }
};

export const createSession = async (req, res) => {
    try {
        const { code, name } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: 'Code and name are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO sessions (code, name, active) VALUES (?, ?, TRUE)',
            [code, name]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'SESSION_CREATED', 'session', result.insertId, JSON.stringify({ code, name })]
        );

        res.status(201).json({
            success: true,
            sessionId: result.insertId,
            message: 'Session created successfully.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Session code already exists.' });
        }
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Server error creating session.' });
    }
};

export const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, active } = req.body;

        await pool.query(
            'UPDATE sessions SET code = ?, name = ?, active = ? WHERE id = ?',
            [code, name, active, id]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'SESSION_UPDATED', 'session', id, JSON.stringify({ code, name, active })]
        );

        res.json({ success: true, message: 'Session updated successfully.' });
    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({ error: 'Server error updating session.' });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sessions WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SESSION_DELETED', 'session', id]
        );

        res.json({ success: true, message: 'Session deleted successfully.' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Server error deleting session.' });
    }
};

// ===================================
// DEPARTMENT MANAGEMENT
// ===================================

export const getDepartments = async (req, res) => {
    try {
        const [departments] = await pool.query('SELECT * FROM departments ORDER BY name');
        res.json({ success: true, departments });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Server error getting departments.' });
    }
};

export const createDepartment = async (req, res) => {
    try {
        const { code, name } = req.body;

        if (!code || !name) {
            return res.status(400).json({ error: 'Code and name are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO departments (code, name, active) VALUES (?, ?, TRUE)',
            [code, name]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DEPARTMENT_CREATED', 'department', result.insertId, JSON.stringify({ code, name })]
        );

        res.status(201).json({
            success: true,
            departmentId: result.insertId,
            message: 'Department created successfully.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Department code already exists.' });
        }
        console.error('Create department error:', error);
        res.status(500).json({ error: 'Server error creating department.' });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, active } = req.body;

        await pool.query(
            'UPDATE departments SET code = ?, name = ?, active = ? WHERE id = ?',
            [code, name, active, id]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DEPARTMENT_UPDATED', 'department', id, JSON.stringify({ code, name, active })]
        );

        res.json({ success: true, message: 'Department updated successfully.' });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({ error: 'Server error updating department.' });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM departments WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DEPARTMENT_DELETED', 'department', id]
        );

        res.json({ success: true, message: 'Department deleted successfully.' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ error: 'Server error deleting department.' });
    }
};

// ===================================
// COURSE MANAGEMENT
// ===================================

export const getCourses = async (req, res) => {
    try {
        const [courses] = await pool.query(`
            SELECT c.*, d.code as department_code, d.name as department_name
            FROM courses c
            JOIN departments d ON c.department_id = d.id
            ORDER BY c.code
        `);
        res.json({ success: true, courses });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ error: 'Server error getting courses.' });
    }
};

export const createCourse = async (req, res) => {
    try {
        const { code, name, department_id } = req.body;

        if (!code || !name || !department_id) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const [result] = await pool.query(
            'INSERT INTO courses (code, name, department_id, active) VALUES (?, ?, ?, TRUE)',
            [code, name, department_id]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'COURSE_CREATED', 'course', result.insertId, JSON.stringify({ code, name, department_id })]
        );

        res.status(201).json({
            success: true,
            courseId: result.insertId,
            message: 'Course created successfully.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Course code already exists.' });
        }
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Server error creating course.' });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, department_id, active } = req.body;

        await pool.query(
            'UPDATE courses SET code = ?, name = ?, department_id = ?, active = ? WHERE id = ?',
            [code, name, department_id, active, id]
        );

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'COURSE_UPDATED', 'course', id, JSON.stringify({ code, name, department_id, active })]
        );

        res.json({ success: true, message: 'Course updated successfully.' });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Server error updating course.' });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM courses WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'COURSE_DELETED', 'course', id]
        );

        res.json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Server error deleting course.' });
    }
};

// ===================================
// COURSE ROLE MAPPING
// ===================================

export const getCourseRoleMappings = async (req, res) => {
    try {
        const [mappings] = await pool.query(`
            SELECT 
                crm.*,
                c.code as course_code,
                c.name as course_name,
                coord.name as coordinator_name,
                dean.name as deputy_dean_name
            FROM course_role_map crm
            JOIN courses c ON crm.course_id = c.id
            LEFT JOIN users coord ON crm.coordinator_user_id = coord.id
            LEFT JOIN users dean ON crm.deputy_dean_user_id = dean.id
            ORDER BY c.code
        `);
        res.json({ success: true, mappings });
    } catch (error) {
        console.error('Get course role mappings error:', error);
        res.status(500).json({ error: 'Server error getting course role mappings.' });
    }
};

export const saveCourseRoleMapping = async (req, res) => {
    try {
        const { course_id, coordinator_user_id, deputy_dean_user_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'Course is required.' });
        }

        // Validate coordinator has COORDINATOR privilege
        if (coordinator_user_id) {
            const [coordPriv] = await pool.query(
                'SELECT * FROM user_privileges WHERE user_id = ? AND privilege = ? AND active = TRUE',
                [coordinator_user_id, 'COORDINATOR']
            );
            if (coordPriv.length === 0) {
                return res.status(400).json({ error: 'Selected coordinator does not have COORDINATOR privilege.' });
            }
        }

        // Validate deputy dean has DEPUTY_DEAN privilege
        if (deputy_dean_user_id) {
            const [deanPriv] = await pool.query(
                'SELECT * FROM user_privileges WHERE user_id = ? AND privilege = ? AND active = TRUE',
                [deputy_dean_user_id, 'DEPUTY_DEAN']
            );
            if (deanPriv.length === 0) {
                return res.status(400).json({ error: 'Selected deputy dean does not have DEPUTY_DEAN privilege.' });
            }
        }

        // Prevent same user as coordinator and deputy dean
        if (coordinator_user_id && deputy_dean_user_id && coordinator_user_id === deputy_dean_user_id) {
            return res.status(400).json({ error: 'Coordinator and deputy dean cannot be the same person.' });
        }

        await pool.query(`
            INSERT INTO course_role_map (course_id, coordinator_user_id, deputy_dean_user_id, active)
            VALUES (?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE 
                coordinator_user_id = VALUES(coordinator_user_id),
                deputy_dean_user_id = VALUES(deputy_dean_user_id),
                active = TRUE
        `, [course_id, coordinator_user_id, deputy_dean_user_id]);

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'COURSE_ROLE_MAPPING_SAVED', 'course_role_map', course_id, 
             JSON.stringify({ course_id, coordinator_user_id, deputy_dean_user_id })]
        );

        res.json({ success: true, message: 'Course role mapping saved successfully.' });
    } catch (error) {
        console.error('Save course role mapping error:', error);
        res.status(500).json({ error: 'Server error saving course role mapping.' });
    }
};

export const deleteCourseRoleMapping = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM course_role_map WHERE id = ?', [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'COURSE_ROLE_MAPPING_DELETED', 'course_role_map', id]
        );

        res.json({ success: true, message: 'Course role mapping deleted successfully.' });
    } catch (error) {
        console.error('Delete course role mapping error:', error);
        res.status(500).json({ error: 'Server error deleting course role mapping.' });
    }
};

// ===================================
// AUDIT LOG
// ===================================

export const getAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const [logs] = await pool.query(`
            SELECT 
                al.*,
                u.name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [limit]);

        res.json({ success: true, logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Server error getting audit logs.' });
    }
};

