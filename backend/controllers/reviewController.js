import { pool } from '../config/database.js';

// Get coordinator review queue
export const getCoordinatorQueue = async (req, res) => {
    try {
        // Get courses where current user is coordinator
        const [mappings] = await pool.query(
            'SELECT course_id FROM course_role_map WHERE coordinator_user_id = ? AND active = TRUE',
            [req.user.id]
        );

        if (mappings.length === 0) {
            return res.json({
                success: true,
                submissions: []
            });
        }

        const courseIds = mappings.map(m => m.course_id);

        // Get submissions for these courses with status SUBMITTED
        const [submissions] = await pool.query(`
            SELECT 
                s.*,
                sess.code as session_code,
                sess.name as session_name,
                d.code as department_code,
                d.name as department_name,
                c.code as course_code,
                c.name as course_name,
                u.name as lecturer_name
            FROM submissions s
            JOIN sessions sess ON s.session_id = sess.id
            JOIN departments d ON s.department_id = d.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.lecturer_user_id = u.id
            WHERE s.course_id IN (?) AND s.status = 'SUBMITTED'
            ORDER BY s.submitted_at ASC
        `, [courseIds]);

        // Get documents for each submission
        for (let submission of submissions) {
            const [documents] = await pool.query(
                'SELECT document_type, not_applicable FROM submission_documents WHERE submission_id = ?',
                [submission.id]
            );
            submission.documents = documents;
        }

        res.json({
            success: true,
            submissions
        });
    } catch (error) {
        console.error('Get coordinator queue error:', error);
        res.status(500).json({ error: 'Server error getting coordinator queue.' });
    }
};

// Coordinator approve submission
export const coordinatorApprove = async (req, res) => {
    try {
        const { id } = req.params;

        // Get submission
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        if (submission.status !== 'SUBMITTED') {
            return res.status(400).json({ error: 'Only submitted submissions can be approved.' });
        }

        // Check if current user is coordinator for this course
        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND coordinator_user_id = ? AND active = TRUE',
            [submission.course_id, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ error: 'You are not the coordinator for this course.' });
        }

        // Get deputy dean
        const deputyDeanId = mappings[0].deputy_dean_user_id;

        if (!deputyDeanId) {
            return res.status(400).json({ error: 'No deputy dean assigned to this course. Please contact admin.' });
        }

        // Update submission status
        await pool.query(`
            UPDATE submissions 
            SET status = 'COORDINATOR_APPROVED', 
                current_assignee_id = ?,
                coordinator_approved_at = NOW()
            WHERE id = ?
        `, [deputyDeanId, id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'COORDINATOR_APPROVED', 'submission', id, JSON.stringify({ deputy_dean_id: deputyDeanId })]
        );

        res.json({
            success: true,
            message: 'Submission approved successfully. Forwarded to Deputy Dean.'
        });
    } catch (error) {
        console.error('Coordinator approve error:', error);
        res.status(500).json({ error: 'Server error approving submission.' });
    }
};

// Coordinator reject submission
export const coordinatorReject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required.' });
        }

        // Get submission
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        if (submission.status !== 'SUBMITTED') {
            return res.status(400).json({ error: 'Only submitted submissions can be rejected.' });
        }

        // Check if current user is coordinator for this course
        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND coordinator_user_id = ? AND active = TRUE',
            [submission.course_id, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ error: 'You are not the coordinator for this course.' });
        }

        // Update submission status
        await pool.query(`
            UPDATE submissions 
            SET status = 'REJECTED', 
                current_assignee_id = NULL,
                rejected_at = NOW(),
                rejection_reason = ?
            WHERE id = ?
        `, [reason, id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'COORDINATOR_REJECTED', 'submission', id, JSON.stringify({ reason })]
        );

        res.json({
            success: true,
            message: 'Submission rejected.'
        });
    } catch (error) {
        console.error('Coordinator reject error:', error);
        res.status(500).json({ error: 'Server error rejecting submission.' });
    }
};

// Get deputy dean endorsement queue
export const getDeputyDeanQueue = async (req, res) => {
    try {
        // Get courses where current user is deputy dean
        const [mappings] = await pool.query(
            'SELECT course_id FROM course_role_map WHERE deputy_dean_user_id = ? AND active = TRUE',
            [req.user.id]
        );

        if (mappings.length === 0) {
            return res.json({
                success: true,
                submissions: []
            });
        }

        const courseIds = mappings.map(m => m.course_id);

        // Get submissions for these courses with status COORDINATOR_APPROVED
        const [submissions] = await pool.query(`
            SELECT 
                s.*,
                sess.code as session_code,
                sess.name as session_name,
                d.code as department_code,
                d.name as department_name,
                c.code as course_code,
                c.name as course_name,
                u.name as lecturer_name
            FROM submissions s
            JOIN sessions sess ON s.session_id = sess.id
            JOIN departments d ON s.department_id = d.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.lecturer_user_id = u.id
            WHERE s.course_id IN (?) AND s.status = 'COORDINATOR_APPROVED'
            ORDER BY s.coordinator_approved_at ASC
        `, [courseIds]);

        // Get documents for each submission
        for (let submission of submissions) {
            const [documents] = await pool.query(
                'SELECT document_type, not_applicable FROM submission_documents WHERE submission_id = ?',
                [submission.id]
            );
            submission.documents = documents;
        }

        res.json({
            success: true,
            submissions
        });
    } catch (error) {
        console.error('Get deputy dean queue error:', error);
        res.status(500).json({ error: 'Server error getting deputy dean queue.' });
    }
};

// Deputy dean endorse submission
export const deputyDeanEndorse = async (req, res) => {
    try {
        const { id } = req.params;

        // Get submission
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        if (submission.status !== 'COORDINATOR_APPROVED') {
            return res.status(400).json({ error: 'Only coordinator-approved submissions can be endorsed.' });
        }

        // Check if current user is deputy dean for this course
        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND deputy_dean_user_id = ? AND active = TRUE',
            [submission.course_id, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ error: 'You are not the deputy dean for this course.' });
        }

        // Update submission status
        await pool.query(`
            UPDATE submissions 
            SET status = 'DEAN_ENDORSED', 
                current_assignee_id = NULL,
                dean_endorsed_at = NOW()
            WHERE id = ?
        `, [id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'DEAN_ENDORSED', 'submission', id]
        );

        res.json({
            success: true,
            message: 'Submission endorsed successfully.'
        });
    } catch (error) {
        console.error('Deputy dean endorse error:', error);
        res.status(500).json({ error: 'Server error endorsing submission.' });
    }
};

// Deputy dean reject submission
export const deputyDeanReject = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required.' });
        }

        // Get submission
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        if (submission.status !== 'COORDINATOR_APPROVED') {
            return res.status(400).json({ error: 'Only coordinator-approved submissions can be rejected.' });
        }

        // Check if current user is deputy dean for this course
        const [mappings] = await pool.query(
            'SELECT * FROM course_role_map WHERE course_id = ? AND deputy_dean_user_id = ? AND active = TRUE',
            [submission.course_id, req.user.id]
        );

        if (mappings.length === 0) {
            return res.status(403).json({ error: 'You are not the deputy dean for this course.' });
        }

        // Update submission status
        await pool.query(`
            UPDATE submissions 
            SET status = 'REJECTED', 
                current_assignee_id = NULL,
                rejected_at = NOW(),
                rejection_reason = ?
            WHERE id = ?
        `, [reason, id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DEPUTY_DEAN_REJECTED', 'submission', id, JSON.stringify({ reason })]
        );

        res.json({
            success: true,
            message: 'Submission rejected.'
        });
    } catch (error) {
        console.error('Deputy dean reject error:', error);
        res.status(500).json({ error: 'Server error rejecting submission.' });
    }
};

// Get all submissions (for dashboard view)
export const getAllSubmissions = async (req, res) => {
    try {
        let whereClause = '';
        const params = [];

        // Filter based on user role
        if (!req.user.privileges.includes('ADMIN')) {
            // Coordinator sees their course submissions (SUBMITTED and above)
            if (req.user.privileges.includes('COORDINATOR')) {
                const [mappings] = await pool.query(
                    'SELECT course_id FROM course_role_map WHERE coordinator_user_id = ? AND active = TRUE',
                    [req.user.id]
                );
                const courseIds = mappings.map(m => m.course_id);
                if (courseIds.length > 0) {
                    whereClause = `WHERE s.course_id IN (?) AND s.status != 'DRAFT'`;
                    params.push(courseIds);
                }
            }
            
            // Deputy dean sees their course submissions (COORDINATOR_APPROVED and above)
            if (req.user.privileges.includes('DEPUTY_DEAN')) {
                const [mappings] = await pool.query(
                    'SELECT course_id FROM course_role_map WHERE deputy_dean_user_id = ? AND active = TRUE',
                    [req.user.id]
                );
                const courseIds = mappings.map(m => m.course_id);
                if (courseIds.length > 0) {
                    whereClause = `WHERE s.course_id IN (?) AND s.status IN ('COORDINATOR_APPROVED', 'DEAN_ENDORSED')`;
                    params.push(courseIds);
                }
            }
        }

        const query = `
            SELECT 
                s.*,
                sess.code as session_code,
                sess.name as session_name,
                d.code as department_code,
                d.name as department_name,
                c.code as course_code,
                c.name as course_name,
                u.name as lecturer_name
            FROM submissions s
            JOIN sessions sess ON s.session_id = sess.id
            JOIN departments d ON s.department_id = d.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.lecturer_user_id = u.id
            ${whereClause}
            ORDER BY s.created_at DESC
        `;

        const [submissions] = params.length > 0 
            ? await pool.query(query, params)
            : await pool.query(query);

        // Get documents for each submission
        for (let submission of submissions) {
            const [documents] = await pool.query(
                'SELECT document_type, not_applicable FROM submission_documents WHERE submission_id = ?',
                [submission.id]
            );
            
            // Create document map for easy checking
            const docMap = {};
            documents.forEach(doc => {
                docMap[doc.document_type] = !doc.not_applicable;
            });
            
            submission.document_checks = docMap;
        }

        res.json({
            success: true,
            submissions
        });
    } catch (error) {
        console.error('Get all submissions error:', error);
        res.status(500).json({ error: 'Server error getting submissions.' });
    }
};

