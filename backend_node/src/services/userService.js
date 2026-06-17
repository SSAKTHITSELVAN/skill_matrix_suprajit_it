import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { generateRandomPassword } from '../utils/password.js';

async function createUserByAdmin(data) {
    const randomPassword = generateRandomPassword(data.name);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            role: data.role,
            category: data.category || null,
            platform: data.platform || null,
            stream: data.stream || null,
            department: data.department || null,
            designation: data.designation || null,
            manager_id: data.manager_id || null,
            lead_id: data.lead_id || null,
            department_head_id: data.department_head_id || null,
            date_of_joining: data.date_of_joining ? new Date(data.date_of_joining) : null,
            project_name: data.project_name || null,
            project_role: data.project_role || null,
            password_hash: hashedPassword,
        },
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category,
        platform: user.platform,
        tempPassword: randomPassword,
    };
}

async function getAllUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            category: true,
            platform: true,
            stream: true,
            department: true,
            designation: true,
            manager_id: true,
            lead_id: true,
            date_of_joining: true,
            project_name: true,
            project_role: true,
            status: true,
            created_at: true,
            manager: { select: { id: true, name: true } },
            lead: { select: { id: true, name: true } },
        },
    });
    return users;
}

async function getUserById(id) {
    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            category: true,
            platform: true,
            stream: true,
            department: true,
            designation: true,
            manager_id: true,
            lead_id: true,
            department_head_id: true,
            updated_by_id: true,
            date_of_joining: true,
            years_of_experience: true,
            project_name: true,
            project_role: true,
            status: true,
            created_at: true,
            updated_at: true,
            manager: {
                select: { id: true, name: true, email: true, role: true },
            },
            lead: {
                select: { id: true, name: true, email: true, role: true },
            },
            departmentHead: {
                select: { id: true, name: true, email: true, role: true },
            },
            updatedBy: {
                select: { id: true, name: true, role: true },
            },
        },
    });
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

async function updateUser(id, data) {
    const updateData = { ...data };
    if (data.date_of_joining) {
        updateData.date_of_joining = new Date(data.date_of_joining);
    }
    if (data.manager_id !== undefined) {
        updateData.manager_id = data.manager_id ? parseInt(data.manager_id) : null;
    }
    if (data.lead_id !== undefined) {
        updateData.lead_id = data.lead_id ? parseInt(data.lead_id) : null;
    }
    if (data.department_head_id !== undefined) {
        updateData.department_head_id = data.department_head_id ? parseInt(data.department_head_id) : null;
    }
    const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
    });
    return user;
}

async function deleteUser(id) {
    await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status: 'INACTIVE' },
    });
    return { message: 'User deactivated successfully' };
}

async function resetPassword(id) {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    const randomPassword = generateRandomPassword(user.name);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    await prisma.user.update({
        where: { id: parseInt(id) },
        data: { password_hash: hashedPassword, must_change_password: true },
    });

    return { tempPassword: randomPassword };
}

async function getTeamMembers(userId, userRole) {
    let whereCondition;

    if (userRole === 'ADMIN') {
        whereCondition = { role: { not: 'ADMIN' }, id: { not: parseInt(userId) } };
    } else if (userRole === 'CTO') {
        whereCondition = { department_head_id: parseInt(userId) };
    } else if (userRole === 'DEPARTMENT_HEAD') {
        whereCondition = { department_head_id: parseInt(userId) };
    } else if (userRole === 'MANAGER') {
        whereCondition = { manager_id: parseInt(userId) };
    } else if (userRole === 'LEAD') {
        whereCondition = { lead_id: parseInt(userId) };
    } else {
        whereCondition = { id: -1 };
    }

    const members = await prisma.user.findMany({
        where: whereCondition,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            category: true,
            platform: true,
            stream: true,
            department: true,
            designation: true,
            project_name: true,
            project_role: true,
            status: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
    return members;
}

async function changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
    });
    if (!user) {
        throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { password_hash: hashedPassword, must_change_password: false },
    });

    return { message: 'Password changed successfully' };
}

async function getManagersAndLeads() {
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'] },
            status: 'active',
        },
        select: { id: true, name: true, role: true },
    });
    return users;
}

export {
    createUserByAdmin,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    resetPassword,
    getTeamMembers,
    changePassword,
    getManagersAndLeads,
};
