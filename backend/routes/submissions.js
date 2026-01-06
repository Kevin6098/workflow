import express from 'express';
import {
    getMySubmissions,
    getSubmission,
    createSubmission,
    updateSubmission,
    submitForReview,
    deleteSubmission,
    uploadDocument,
    deleteDocument,
    downloadDocument
} from '../controllers/submissionController.js';
import { authenticate } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Submission routes
router.get('/', getMySubmissions);
router.get('/:id', getSubmission);
router.post('/', createSubmission);
router.put('/:id', updateSubmission);
router.post('/:id/submit', submitForReview);
router.delete('/:id', deleteSubmission);

// Document routes
router.post('/:id/documents', upload.single('file'), handleUploadError, uploadDocument);
router.delete('/:id/documents/:docId', deleteDocument);

// Download route
router.get('/documents/:docId/download', downloadDocument);

export default router;

