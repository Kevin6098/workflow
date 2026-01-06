import express from 'express';
import {
    getCoordinatorQueue,
    coordinatorApprove,
    coordinatorReject,
    getDeputyDeanQueue,
    deputyDeanEndorse,
    deputyDeanReject,
    getAllSubmissions
} from '../controllers/reviewController.js';
import { authenticate, hasPrivilege } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Coordinator routes
router.get('/coordinator/queue', hasPrivilege('COORDINATOR'), getCoordinatorQueue);
router.post('/coordinator/submissions/:id/approve', hasPrivilege('COORDINATOR'), coordinatorApprove);
router.post('/coordinator/submissions/:id/reject', hasPrivilege('COORDINATOR'), coordinatorReject);

// Deputy Dean routes
router.get('/dean/queue', hasPrivilege('DEPUTY_DEAN'), getDeputyDeanQueue);
router.post('/dean/submissions/:id/endorse', hasPrivilege('DEPUTY_DEAN'), deputyDeanEndorse);
router.post('/dean/submissions/:id/reject', hasPrivilege('DEPUTY_DEAN'), deputyDeanReject);

// Dashboard route (for all users to see submissions in table view)
router.get('/dashboard/submissions', getAllSubmissions);

export default router;

