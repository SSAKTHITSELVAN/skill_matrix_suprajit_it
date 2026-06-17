import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    createUser,
    listUsers,
    getUser,
    editUser,
    removeUser,
    resetUserPassword,
    getTeam,
    getProfile,
    updateProfile,
    changeMyPassword,
    listManagersAndLeads,
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changeMyPassword);
router.get('/team', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'), getTeam);
router.get('/managers-leads', authenticate, listManagersAndLeads);

router.post('/', authenticate, authorize('ADMIN'), createUser);
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), listUsers);
router.get('/:id', authenticate, getUser);
router.put('/:id', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD', 'MANAGER'), editUser);
router.delete('/:id', authenticate, authorize('ADMIN'), removeUser);
router.post('/:id/reset-password', authenticate, authorize('ADMIN'), resetUserPassword);

export default router;
