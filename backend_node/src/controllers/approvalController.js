import {
    getPendingApprovals,
    approveRequest,
    rejectRequest,
    getApprovalsByUser,
} from '../services/approvalService.js';

async function listPendingApprovals(req, res) {
    try {
        const approvals = await getPendingApprovals(req.user.userId);
        res.status(200).json(approvals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function approve(req, res) {
    try {
        const result = await approveRequest(req.params.id, req.user.userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function reject(req, res) {
    try {
        const result = await rejectRequest(req.params.id, req.user.userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function myApprovals(req, res) {
    try {
        const approvals = await getApprovalsByUser(req.user.userId);
        res.status(200).json(approvals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export { listPendingApprovals, approve, reject, myApprovals };
