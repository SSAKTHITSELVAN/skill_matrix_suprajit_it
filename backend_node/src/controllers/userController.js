import {
    createUserByAdmin,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
    getTeamMembers,
    changePassword,
    getManagersAndLeads,
} from '../services/userService.js';
import { createApprovalRequest } from '../services/approvalService.js';

async function createUser(req, res) {
    try {
        const user = await createUserByAdmin(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listUsers(req, res) {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getUser(req, res) {
    try {
        const user = await getUserById(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

async function editUser(req, res) {
    try {
        const requesterRole = req.user.role;
        const requesterId = req.user.userId;
        const targetId = parseInt(req.params.id);
        const targetUser = await getUserById(targetId);

        let canEdit = false;

        if (requesterRole === 'ADMIN') {
            canEdit = targetUser.role !== 'ADMIN';
        } else if (requesterRole === 'CTO') {
            canEdit = targetUser.department_head_id === requesterId;
        } else if (requesterRole === 'DEPARTMENT_HEAD') {
            canEdit = targetUser.department_head_id === requesterId;
        } else if (requesterRole === 'MANAGER') {
            canEdit = targetUser.manager_id === requesterId;
        }

        if (canEdit) {
            const user = await updateUser(targetId, { ...req.body, updated_by_id: requesterId });
            return res.status(200).json(user);
        }

        return res.status(403).json({ message: 'You do not have permission to edit this user' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function removeUser(req, res) {
    try {
        const result = await deleteUser(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function resetUserPassword(req, res) {
    try {
        const result = await resetPassword(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function getTeam(req, res) {
    try {
        const members = await getTeamMembers(req.user.userId, req.user.role);
        res.status(200).json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getProfile(req, res) {
    try {
        const user = await getUserById(req.user.userId);
        res.status(200).json(user);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

async function updateProfile(req, res) {
    try {
        const requesterRole = req.user.role;
        const userId = req.user.userId;

        const directFields = ['manager_id', 'lead_id', 'department_head_id', 'date_of_joining'];
        const directUpdates = {};
        const approvalFields = {};

        for (const [field, value] of Object.entries(req.body)) {
            if (directFields.includes(field)) {
                directUpdates[field] = value;
            } else {
                approvalFields[field] = value;
            }
        }

        if (Object.keys(directUpdates).length > 0) {
            await updateUser(userId, directUpdates);
        }

        const noApprovalRoles = ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER'];
        if (noApprovalRoles.includes(requesterRole)) {
            if (Object.keys(approvalFields).length > 0) {
                await updateUser(userId, { ...approvalFields, updated_by_id: userId });
            }
            const updated = await getUserById(userId);
            return res.status(200).json(updated);
        }

        if (Object.keys(approvalFields).length > 0) {
            const currentUser = await getUserById(userId);
            const requests = [];
            for (const [field, newValue] of Object.entries(approvalFields)) {
                requests.push(
                    createApprovalRequest({
                        user_id: userId,
                        field_name: field,
                        old_value: currentUser[field] ? String(currentUser[field]) : null,
                        new_value: String(newValue),
                        changed_by: userId,
                    })
                );
            }
            await Promise.all(requests);

            if (Object.keys(directUpdates).length > 0) {
                const updated = await getUserById(userId);
                return res.status(200).json({ ...updated, message: 'Hierarchy updated. Other changes submitted for approval.' });
            }
            return res.status(202).json({ message: 'Changes submitted for approval' });
        }

        const updated = await getUserById(userId);
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function changeMyPassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const result = await changePassword(req.user.userId, oldPassword, newPassword);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listManagersAndLeads(req, res) {
    try {
        const users = await getManagersAndLeads();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export {
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
};
