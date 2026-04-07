const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const notificationService = require('../services/notifications');

router.use(protect);

// In-memory storage (replace with database in production)
const certificates = {};
let certificateCounter = 0;

/**
 * Issue a new certificate
 */
router.post('/issue', restrictTo('admin', 'hospital'), async (req, res) => {
    try {
        const {
            recipientAddress,
            recipientName,
            certificateType, // "Doctor", "Pharmacist", "Nurse"
            licenseNumber,
            validityYears,
            issuedBy,
            ipfsHash
        } = req.body;

        const certificateId = certificateCounter++;
        const now = Date.now();
        const expiryDate = now + (validityYears * 365 * 24 * 60 * 60 * 1000);

        certificates[certificateId] = {
            id: certificateId,
            recipientAddress,
            recipientName,
            certificateType,
            licenseNumber,
            issuedDate: now,
            expiryDate,
            issuedBy,
            ipfsHash,
            revoked: false,
            status: 'ACTIVE'
        };

        await notificationService.notifyCertificateEvent(recipientAddress, 'ISSUED', certificates[certificateId]);

        res.json({
            message: 'Certificate issued successfully',
            certificateId,
            certificate: certificates[certificateId]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Verify certificate
 */
router.get('/verify/:certificateId', (req, res) => {
    try {
        const { certificateId } = req.params;
        const cert = certificates[certificateId];

        if (!cert) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        const isExpired = Date.now() > cert.expiryDate;
        const isValid = !cert.revoked && !isExpired;

        res.json({
            certificateId,
            certificate: cert,
            isValid,
            isExpired,
            status: isValid ? 'VALID' : isExpired ? 'EXPIRED' : 'REVOKED'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user certificates
 */
router.get('/user/:address', (req, res) => {
    try {
        const { address } = req.params;
        const userCerts = Object.values(certificates).filter(
            cert => cert.recipientAddress.toLowerCase() === address.toLowerCase()
        );

        res.json({
            recipientAddress: address,
            certificates: userCerts,
            total: userCerts.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/check-expiry', restrictTo('admin', 'hospital'), async (req, res) => {
    try {
        const windowDays = Number(req.body.windowDays || 30);
        const now = Date.now();
        const windowEnd = now + windowDays * 24 * 60 * 60 * 1000;

        const expiring = Object.values(certificates).filter((cert) => {
            return cert.status === 'ACTIVE' && cert.expiryDate >= now && cert.expiryDate <= windowEnd;
        });

        for (const cert of expiring) {
            await notificationService.notifyCertificateEvent(cert.recipientAddress, 'EXPIRING', cert);
        }

        res.json({
            message: 'Certificate expiry check complete',
            windowDays,
            notified: expiring.length,
            certificates: expiring,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Revoke certificate
 */
router.post('/revoke/:certificateId', restrictTo('admin', 'hospital'), async (req, res) => {
    try {
        const { certificateId } = req.params;
        const { revokedBy, reason } = req.body;

        if (!certificates[certificateId]) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        certificates[certificateId].revoked = true;
        certificates[certificateId].status = 'REVOKED';
        certificates[certificateId].revokedBy = revokedBy;
        certificates[certificateId].revokedReason = reason;
        certificates[certificateId].revokedDate = Date.now();

        await notificationService.notifyCertificateEvent(certificates[certificateId].recipientAddress, 'REVOKED', certificates[certificateId]);

        res.json({
            message: 'Certificate revoked successfully',
            certificate: certificates[certificateId]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all certificates (admin view)
 */
router.get('/', restrictTo('admin'), (req, res) => {
    try {
        const allCerts = Object.values(certificates);

        res.json({
            total: allCerts.length,
            certificates: allCerts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
