const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// In-memory approval requests
const approvalRequests = {};
let requestCounter = 0;

// Authorized signers/authorities
const authorizedSigners = [
    '0x1234567890123456789012345678901234567890',
    '0x0987654321098765432109876543210987654321'
];

/**
 * Create multi-sig approval request
 */
router.post('/request', restrictTo('admin', 'doctor', 'hospital'), (req, res) => {
    try {
        const {
            transactionType, // "blood-donation", "organ-donation", "certificate-issue", etc.
            data,
            createdBy,
            requiredApprovals = 2 // default 2 signatures needed
        } = req.body;

        const requestId = requestCounter++;
        const now = Date.now();

        approvalRequests[requestId] = {
            id: requestId,
            transactionType,
            data,
            createdBy,
            createdAt: now,
            requiredApprovals,
            currentApprovals: [],
            status: 'PENDING',
            approvalDeadline: now + (24 * 60 * 60 * 1000) // 24 hours
        };

        res.json({
            message: 'Approval request created',
            requestId,
            request: approvalRequests[requestId]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Sign/Approve a multi-sig request
 */
router.post('/approve/:requestId', restrictTo('admin', 'doctor', 'hospital'), (req, res) => {
    try {
        const { requestId } = req.params;
        const { signerAddress, signature } = req.body;

        if (!approvalRequests[requestId]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = approvalRequests[requestId];

        // Check if signer is authorized
        if (!authorizedSigners.includes(signerAddress)) {
            return res.status(403).json({ error: 'Signer not authorized' });
        }

        // Check if already signed
        if (request.currentApprovals.find(a => a.signerAddress === signerAddress)) {
            return res.status(400).json({ error: 'Already signed by this address' });
        }

        // Check deadline
        if (Date.now() > request.approvalDeadline) {
            request.status = 'EXPIRED';
            return res.status(400).json({ error: 'Approval request expired' });
        }

        // Add approval
        request.currentApprovals.push({
            signerAddress,
            signature,
            timestamp: Date.now()
        });

        // Check if enough approvals
        if (request.currentApprovals.length >= request.requiredApprovals) {
            request.status = 'APPROVED';
            request.approvedAt = Date.now();
        }

        res.json({
            message: 'Approval recorded',
            requestId,
            request,
            status: request.status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get approval request status
 */
router.get('/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;

        if (!approvalRequests[requestId]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = approvalRequests[requestId];

        res.json({
            requestId,
            request,
            approvalProgress: {
                current: request.currentApprovals.length,
                required: request.requiredApprovals,
                percentage: (request.currentApprovals.length / request.requiredApprovals) * 100
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all approval requests
 */
router.get('/', (req, res) => {
    try {
        const { status } = req.query;

        let requests = Object.values(approvalRequests);

        if (status) {
            requests = requests.filter(r => r.status === status);
        }

        res.json({
            total: requests.length,
            requests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reject approval request
 */
router.post('/reject/:requestId', restrictTo('admin', 'doctor', 'hospital'), (req, res) => {
    try {
        const { requestId } = req.params;
        const { rejectedBy, reason } = req.body;

        if (!approvalRequests[requestId]) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = approvalRequests[requestId];
        request.status = 'REJECTED';
        request.rejectedBy = rejectedBy;
        request.rejectionReason = reason;
        request.rejectedAt = Date.now();

        res.json({
            message: 'Request rejected',
            request
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
