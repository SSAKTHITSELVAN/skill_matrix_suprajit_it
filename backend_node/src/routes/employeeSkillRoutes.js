import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    assignSkill,
    getUserSkills,
    editEmployeeSkill,
    removeEmployeeSkill,
    approveSkill,
    rejectSkill,
    pendingSkillApprovals,
    viewSkillMatrix,
    viewOrgTree,
    assignSkillWithProficiencies,
    updateSkillWithProficiencies,
    getSkillDetails,
} from '../controllers/employeeSkillController.js';

const router = express.Router();

// Legacy endpoints (for backward compatibility)
router.post('/', authenticate, assignSkill);
router.get('/my-skills', authenticate, getUserSkills);
router.get('/pending', authenticate, authorize('ADMIN', 'MANAGER'), pendingSkillApprovals);
router.put('/:id/approve', authenticate, authorize('ADMIN', 'MANAGER'), approveSkill);
router.put('/:id/reject', authenticate, authorize('ADMIN', 'MANAGER'), rejectSkill);
router.get('/matrix', authenticate, authorize('ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'), viewSkillMatrix);
router.get('/org-tree', authenticate, authorize('ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'), viewOrgTree);
router.get('/user/:userId', authenticate, getUserSkills);
router.put('/:id', authenticate, editEmployeeSkill);
router.delete('/:id', authenticate, removeEmployeeSkill);

// New proficiency-based endpoints
router.post('/with-proficiencies', authenticate, assignSkillWithProficiencies);
router.put('/:id/proficiencies', authenticate, updateSkillWithProficiencies);
router.get('/:id/breakdown', authenticate, getSkillDetails);

export default router;
