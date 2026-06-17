import {
    addEmployeeSkill,
    getSkillsByUser,
    updateEmployeeSkill,
    deleteEmployeeSkill,
    approveEmployeeSkill,
    rejectEmployeeSkill,
    getPendingSkillApprovals,
    getSkillMatrix,
    getOrgTree,
    addEmployeeSkillWithProficiencies,
    updateEmployeeSkillProficiencies,
    getSkillBreakdown,
} from '../services/employeeSkillService.js';
import { getUserById } from '../services/userService.js';

function canManageUser(requesterRole, requesterId, targetUser) {
    if (requesterRole === 'ADMIN' && targetUser.role !== 'ADMIN') return true;
    if (requesterRole === 'CTO' && targetUser.department_head_id === requesterId) return true;
    if (requesterRole === 'DEPARTMENT_HEAD' && targetUser.department_head_id === requesterId) return true;
    if (requesterRole === 'MANAGER' && targetUser.manager_id === requesterId) return true;
    return false;
}

async function assignSkill(req, res) {
    try {
        const targetUserId = parseInt(req.body.user_id || req.user.userId);
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        if (targetUserId !== requesterId) {
            const targetUser = await getUserById(targetUserId);
            if (!canManageUser(requesterRole, requesterId, targetUser)) {
                return res.status(403).json({ message: 'You do not have permission to assign skills to this user' });
            }
        }

        // Admin, CTO, Department Head, Manager — no approval needed (self or others)
        const noApprovalRoles = ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER'];
        const autoApproved = noApprovalRoles.includes(requesterRole);

        const data = {
            user_id: targetUserId,
            skill_id: parseInt(req.body.skill_id),
            selected_topic_ids: req.body.selected_topic_ids.map(id => parseInt(id)),
            target_level: parseInt(req.body.target_level) || 10,
            years_experience: parseInt(req.body.years_experience) || 0,
            can_teach: req.body.can_teach || false,
            status: autoApproved ? 'APPROVED' : 'PENDING',
        };
        const skill = await addEmployeeSkill(data);
        res.status(201).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getUserSkills(req, res) {
    try {
        const userId = req.params.userId || req.user.userId;
        const skills = await getSkillsByUser(userId);
        res.status(200).json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function editEmployeeSkill(req, res) {
    try {
        const data = {
            selected_topic_ids: req.body.selected_topic_ids.map(id => parseInt(id)),
            target_level: parseInt(req.body.target_level) || 10,
            years_experience: parseInt(req.body.years_experience) || 0,
            can_teach: req.body.can_teach || false,
        };
        const skill = await updateEmployeeSkill(req.params.id, data);
        res.status(200).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function removeEmployeeSkill(req, res) {
    try {
        const result = await deleteEmployeeSkill(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function approveSkill(req, res) {
    try {
        const result = await approveEmployeeSkill(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function rejectSkill(req, res) {
    try {
        const result = await rejectEmployeeSkill(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function pendingSkillApprovals(req, res) {
    try {
        const result = await getPendingSkillApprovals(req.user.userId, req.user.role);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function viewSkillMatrix(req, res) {
    try {
        const matrix = await getSkillMatrix(req.user.userId, req.user.role);
        res.status(200).json(matrix);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function viewOrgTree(req, res) {
    try {
        const tree = await getOrgTree();
        res.status(200).json(tree);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function assignSkillWithProficiencies(req, res) {
    try {
        const targetUserId = parseInt(req.body.user_id || req.user.userId);
        const requesterId = req.user.userId;
        const requesterRole = req.user.role;

        if (targetUserId !== requesterId) {
            const targetUser = await getUserById(targetUserId);
            if (!canManageUser(requesterRole, requesterId, targetUser)) {
                return res.status(403).json({ message: 'You do not have permission to assign skills to this user' });
            }
        }

        const noApprovalRoles = ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER'];
        const autoApproved = noApprovalRoles.includes(requesterRole);

        const data = {
            user_id: targetUserId,
            skill_id: parseInt(req.body.skill_id),
            topic_selections: req.body.topic_selections,
            target_level: parseInt(req.body.target_level) || 40,
            years_experience: parseInt(req.body.years_experience) || 0,
            can_teach: req.body.can_teach || false,
            status: autoApproved ? 'APPROVED' : 'PENDING',
        };
        const skill = await addEmployeeSkillWithProficiencies(data);
        res.status(201).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updateSkillWithProficiencies(req, res) {
    try {
        const data = {
            topic_selections: req.body.topic_selections,
            target_level: parseInt(req.body.target_level),
            years_experience: parseInt(req.body.years_experience),
            can_teach: req.body.can_teach,
        };
        const skill = await updateEmployeeSkillProficiencies(req.params.id, data);
        res.status(200).json(skill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getSkillDetails(req, res) {
    try {
        const breakdown = await getSkillBreakdown(req.params.id);
        res.status(200).json(breakdown);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export {
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
};
