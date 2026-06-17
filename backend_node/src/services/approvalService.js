import prisma from '../config/prisma.js';

async function createApprovalRequest(data) {
    const request = await prisma.approvalRequest.create({
        data: {
            user_id: data.user_id,
            field_name: data.field_name,
            old_value: data.old_value || null,
            new_value: data.new_value,
            changed_by: data.changed_by,
        },
    });
    return request;
}

async function getPendingApprovals(managerId) {
    const reportees = await prisma.user.findMany({
        where: { manager_id: parseInt(managerId) },
        select: { id: true },
    });

    const reporteeIds = reportees.map(r => r.id);

    const approvals = await prisma.approvalRequest.findMany({
        where: {
            user_id: { in: reporteeIds },
            status: 'PENDING',
        },
        include: {
            user: { select: { id: true, name: true, email: true } },
            changer: { select: { id: true, name: true } },
        },
        orderBy: { created_at: 'desc' },
    });
    return approvals;
}

async function approveRequest(requestId, approverId) {
    const request = await prisma.approvalRequest.findUnique({
        where: { id: parseInt(requestId) },
    });
    if (!request) {
        throw new Error('Approval request not found');
    }
    if (request.status !== 'PENDING') {
        throw new Error('Request already processed');
    }

    const updated = await prisma.approvalRequest.update({
        where: { id: parseInt(requestId) },
        data: {
            status: 'APPROVED',
            approved_by: approverId,
        },
    });

    await prisma.user.update({
        where: { id: request.user_id },
        data: { [request.field_name]: request.new_value },
    });

    return updated;
}

async function rejectRequest(requestId, approverId) {
    const request = await prisma.approvalRequest.findUnique({
        where: { id: parseInt(requestId) },
    });
    if (!request) {
        throw new Error('Approval request not found');
    }
    if (request.status !== 'PENDING') {
        throw new Error('Request already processed');
    }

    const updated = await prisma.approvalRequest.update({
        where: { id: parseInt(requestId) },
        data: {
            status: 'REJECTED',
            approved_by: approverId,
        },
    });
    return updated;
}

async function getApprovalsByUser(userId) {
    const approvals = await prisma.approvalRequest.findMany({
        where: { user_id: parseInt(userId) },
        orderBy: { created_at: 'desc' },
    });
    return approvals;
}

export {
    createApprovalRequest,
    getPendingApprovals,
    approveRequest,
    rejectRequest,
    getApprovalsByUser,
};
