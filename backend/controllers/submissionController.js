import { pool } from '../config/database.js';
import fs from 'fs';
import path from 'path';

// Get all submissions for current user
export const getMySubmissions = async (req, res) => {
    try {
        const [submissions] = await pool.query(`
            SELECT 
                s.*,
                sess.code as session_code,
                sess.name as session_name,
                d.code as department_code,
                d.name as department_name,
                c.code as course_code,
                c.name as course_name,
                u.name as lecturer_name,
                assignee.name as assignee_name
            FROM submissions s
            JOIN sessions sess ON s.session_id = sess.id
            JOIN departments d ON s.department_id = d.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.lecturer_user_id = u.id
            LEFT JOIN users assignee ON s.current_assignee_id = assignee.id
            WHERE s.lecturer_user_id = ?
            ORDER BY s.created_at DESC
        `, [req.user.id]);

        // Get documents for each submission
        for (let submission of submissions) {
            const [documents] = await pool.query(
                'SELECT * FROM submission_documents WHERE submission_id = ?',
                [submission.id]
            );
            submission.documents = documents;

            const [groups] = await pool.query(
                'SELECT * FROM submission_groups WHERE submission_id = ?',
                [submission.id]
            );
            submission.groups = groups;
        }

        res.json({
            success: true,
            submissions
        });
    } catch (error) {
        console.error('Get my submissions error:', error);
        res.status(500).json({ error: 'Server error getting submissions.' });
    }
};

// Get single submission
export const getSubmission = async (req, res) => {
    try {
        const { id } = req.params;

        const [submissions] = await pool.query(`
            SELECT 
                s.*,
                sess.code as session_code,
                sess.name as session_name,
                d.code as department_code,
                d.name as department_name,
                c.code as course_code,
                c.name as course_name,
                u.name as lecturer_name,
                assignee.name as assignee_name
            FROM submissions s
            JOIN sessions sess ON s.session_id = sess.id
            JOIN departments d ON s.department_id = d.id
            JOIN courses c ON s.course_id = c.id
            JOIN users u ON s.lecturer_user_id = u.id
            LEFT JOIN users assignee ON s.current_assignee_id = assignee.id
            WHERE s.id = ?
        `, [id]);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        // Check permission
        const isOwner = submission.lecturer_user_id === req.user.id;
        const isAssignee = submission.current_assignee_id === req.user.id;
        const isAdmin = req.user.privileges.includes('ADMIN');

        if (!isOwner && !isAssignee && !isAdmin) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Get documents
        const [documents] = await pool.query(
            'SELECT * FROM submission_documents WHERE submission_id = ?',
            [id]
        );
        submission.documents = documents;

        // Get groups
        const [groups] = await pool.query(
            'SELECT * FROM submission_groups WHERE submission_id = ?',
            [id]
        );
        submission.groups = groups;

        res.json({
            success: true,
            submission
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({ error: 'Server error getting submission.' });
    }
};

// Create new submission
export const createSubmission = async (req, res) => {
    try {
        const {
            session_id,
            department_id,
            course_id,
            type_of_study
        } = req.body;

        if (!session_id || !department_id || !course_id || !type_of_study) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const [result] = await pool.query(`
            INSERT INTO submissions 
            (lecturer_user_id, session_id, department_id, course_id, type_of_study, status)
            VALUES (?, ?, ?, ?, ?, 'DRAFT')
        `, [req.user.id, session_id, department_id, course_id, type_of_study]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'SUBMISSION_CREATED', 'submission', result.insertId, JSON.stringify(req.body)]
        );

        res.status(201).json({
            success: true,
            submissionId: result.insertId,
            message: 'Submission created successfully.'
        });
    } catch (error) {
        console.error('Create submission error:', error);
        res.status(500).json({ error: 'Server error creating submission.' });
    }
};

// Update submission
export const updateSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            session_id,
            department_id,
            course_id,
            type_of_study
        } = req.body;

        const isAdmin = req.user.privileges && req.user.privileges.includes('ADMIN');

        // Check if submission exists
        let query = 'SELECT * FROM submissions WHERE id = ?';
        let params = [id];

        // If not admin, check ownership
        if (!isAdmin) {
            query += ' AND lecturer_user_id = ?';
            params.push(req.user.id);
        }

        const [submissions] = await pool.query(query, params);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];

        // Admin can edit any submission
        // Regular users can edit DRAFT, REJECTED, or SUBMITTED submissions
        const editableStatuses = ['DRAFT', 'REJECTED', 'SUBMITTED'];
        if (!isAdmin && !editableStatuses.includes(submission.status)) {
            return res.status(400).json({ error: 'This submission cannot be updated at its current status.' });
        }

        // If updating a rejected submission and not admin, reset to DRAFT
        // Keep SUBMITTED status as-is when editing files
        const newStatus = (!isAdmin && submission.status === 'REJECTED') ? 'DRAFT' : submission.status;

        await pool.query(`
            UPDATE submissions 
            SET session_id = ?, department_id = ?, course_id = ?, type_of_study = ?, status = ?
            WHERE id = ?
        `, [session_id, department_id, course_id, type_of_study, newStatus, id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'SUBMISSION_UPDATED', 'submission', id, JSON.stringify(req.body)]
        );

        res.json({
            success: true,
            message: 'Submission updated successfully.'
        });
    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({ error: 'Server error updating submission.' });
    }
};

// Submit for review (mark as final)
export const submitForReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if submission exists and is owned by user
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ? AND lecturer_user_id = ?',
            [id, req.user.id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        if (submissions[0].status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only draft submissions can be submitted.' });
        }

        // Get course coordinator (if available)
        const [mappings] = await pool.query(
            'SELECT coordinator_user_id FROM course_role_map WHERE course_id = ? AND active = TRUE',
            [submissions[0].course_id]
        );

        // Use coordinator if available, otherwise set to NULL (admin can handle)
        const coordinatorId = mappings.length > 0 && mappings[0].coordinator_user_id 
            ? mappings[0].coordinator_user_id 
            : null;

        await pool.query(`
            UPDATE submissions 
            SET status = 'SUBMITTED', 
                current_assignee_id = ?,
                submitted_at = NOW()
            WHERE id = ?
        `, [coordinatorId, id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'SUBMISSION_SUBMITTED', 'submission', id, JSON.stringify({ coordinator_id: coordinatorId })]
        );

        res.json({
            success: true,
            message: 'Submission submitted for review successfully.'
        });
    } catch (error) {
        console.error('Submit for review error:', error);
        res.status(500).json({ error: 'Server error submitting for review.' });
    }
};

// Delete submission (only if DRAFT)
export const deleteSubmission = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if submission exists and is owned by user
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ? AND lecturer_user_id = ?',
            [id, req.user.id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        if (submissions[0].status !== 'DRAFT') {
            return res.status(400).json({ error: 'Only draft submissions can be deleted.' });
        }

        // Delete files
        const uploadPath = path.join('./uploads/submissions', id.toString());
        if (fs.existsSync(uploadPath)) {
            fs.rmSync(uploadPath, { recursive: true, force: true });
        }

        // Delete from database (cascade will delete documents and groups)
        await pool.query('DELETE FROM submissions WHERE id = ?', [id]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'SUBMISSION_DELETED', 'submission', id]
        );

        res.json({
            success: true,
            message: 'Submission deleted successfully.'
        });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({ error: 'Server error deleting submission.' });
    }
};

// Upload document
export const uploadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, notApplicable } = req.body;
        const isAdmin = req.user.privileges && req.user.privileges.includes('ADMIN');

        // Check if submission exists
        let query = 'SELECT * FROM submissions WHERE id = ?';
        let params = [id];

        // If not admin, check ownership
        if (!isAdmin) {
            query += ' AND lecturer_user_id = ?';
            params.push(req.user.id);
        }

        const [submissions] = await pool.query(query, params);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        // Allow editing for DRAFT, REJECTED, and SUBMITTED status
        // Admin can edit any status
        const editableStatuses = ['DRAFT', 'REJECTED', 'SUBMITTED'];
        if (!isAdmin && !editableStatuses.includes(submissions[0].status)) {
            return res.status(400).json({ error: 'This submission cannot be modified at its current status.' });
        }

        // If not applicable, just store that flag
        if (notApplicable === 'true') {
            await pool.query(`
                INSERT INTO submission_documents 
                (submission_id, document_type, file_name, file_path, file_size, not_applicable)
                VALUES (?, ?, '', '', 0, TRUE)
                ON DUPLICATE KEY UPDATE not_applicable = TRUE
            `, [id, documentType]);

            return res.json({
                success: true,
                message: 'Document marked as not applicable.'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Save document info to database
        await pool.query(`
            INSERT INTO submission_documents 
            (submission_id, document_type, file_name, file_path, file_size, not_applicable)
            VALUES (?, ?, ?, ?, ?, FALSE)
        `, [id, documentType, req.file.originalname, req.file.path, req.file.size]);

        res.json({
            success: true,
            message: 'Document uploaded successfully.',
            file: {
                name: req.file.originalname,
                size: req.file.size,
                type: documentType
            }
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Server error uploading document.' });
    }
};

// Delete document
export const deleteDocument = async (req, res) => {
    try {
        const { id, docId } = req.params;
        const isAdmin = req.user.privileges && req.user.privileges.includes('ADMIN');

        // Check if submission exists
        let query = 'SELECT * FROM submissions WHERE id = ?';
        let params = [id];

        // If not admin, check ownership
        if (!isAdmin) {
            query += ' AND lecturer_user_id = ?';
            params.push(req.user.id);
        }

        const [submissions] = await pool.query(query, params);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        // Admin can delete documents from any submission
        // Regular users can delete from DRAFT, REJECTED, or SUBMITTED submissions
        const editableStatuses = ['DRAFT', 'REJECTED', 'SUBMITTED'];
        if (!isAdmin && !editableStatuses.includes(submissions[0].status)) {
            return res.status(400).json({ error: 'This submission cannot be modified at its current status.' });
        }

        // Get document info
        const [documents] = await pool.query(
            'SELECT * FROM submission_documents WHERE id = ? AND submission_id = ?',
            [docId, id]
        );

        if (documents.length === 0) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        // Delete file from filesystem
        if (documents[0].file_path && fs.existsSync(documents[0].file_path)) {
            fs.unlinkSync(documents[0].file_path);
        }

        // Delete from database
        await pool.query('DELETE FROM submission_documents WHERE id = ?', [docId]);

        // Log audit
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'DOCUMENT_DELETED', 'document', docId, JSON.stringify({ submission_id: id, document_type: documents[0].document_type })]
        );

        res.json({
            success: true,
            message: 'Document deleted successfully.'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Server error deleting document.' });
    }
};

// Download document
export const downloadDocument = async (req, res) => {
    try {
        const { docId } = req.params;

        const [documents] = await pool.query(
            'SELECT * FROM submission_documents WHERE id = ?',
            [docId]
        );

        if (documents.length === 0) {
            return res.status(404).json({ error: 'Document not found.' });
        }

        const document = documents[0];

        // Check permission
        const [submissions] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [document.submission_id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        const submission = submissions[0];
        const isOwner = submission.lecturer_user_id === req.user.id;
        const isAssignee = submission.current_assignee_id === req.user.id;
        const isAdmin = req.user.privileges.includes('ADMIN');

        if (!isOwner && !isAssignee && !isAdmin) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        if (!fs.existsSync(document.file_path)) {
            return res.status(404).json({ error: 'File not found on server.' });
        }

        const fileName = document.file_name || path.basename(document.file_path);
        const fileExt = path.extname(fileName).toLowerCase();
        const filePath = path.resolve(document.file_path);
        
        // Set headers for PDF viewing in browser (inline) or download (attachment)
        if (fileExt === '.pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        } else {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        }
        
        // Use sendFile for better control
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error serving file.' });
                }
            }
        });
    } catch (error) {
        console.error('Download document error:', error);
        res.status(500).json({ error: 'Server error downloading document.' });
    }
};

