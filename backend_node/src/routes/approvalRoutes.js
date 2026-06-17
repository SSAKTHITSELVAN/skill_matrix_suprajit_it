import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    listPendingApprovals,
    approve,
    reject,
    myApprovals,
} from '../controllers/approvalController.js';

const router = express.Router();

router.get('/pending', authenticate, authorize('ADMIN', 'MANAGER'), listPendingApprovals);
router.put('/:id/approve', authenticate, authorize('ADMIN', 'MANAGER'), approve);
router.put('/:id/reject', authenticate, authorize('ADMIN', 'MANAGER'), reject);
router.get('/my-requests', authenticate, myApprovals);

export default router;
