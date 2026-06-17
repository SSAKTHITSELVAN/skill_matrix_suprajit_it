import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
    addSkill,
    listSkills,
    getSkill,
    editSkill,
    removeSkill,
    createTopic,
    editTopic,
    removeTopic,
    reorderSkillTopics,
} from '../controllers/skillController.js';

const router = express.Router();

router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), addSkill);
router.get('/', authenticate, listSkills);
router.get('/:id', authenticate, getSkill);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), editSkill);
router.delete('/:id', authenticate, authorize('ADMIN'), removeSkill);

// Topic management endpoints
router.post('/:skillId/topics', authenticate, authorize('ADMIN', 'MANAGER', 'DEPARTMENT_HEAD'), createTopic);
router.put('/:skillId/topics/:topicId', authenticate, authorize('ADMIN', 'MANAGER', 'DEPARTMENT_HEAD'), editTopic);
router.delete('/:skillId/topics/:topicId', authenticate, authorize('ADMIN', 'MANAGER', 'DEPARTMENT_HEAD'), removeTopic);
router.post('/:skillId/topics/reorder', authenticate, authorize('ADMIN', 'MANAGER', 'DEPARTMENT_HEAD'), reorderSkillTopics);

export default router;
