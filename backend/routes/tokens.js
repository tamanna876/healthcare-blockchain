const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// Mock token balances (in production, query from blockchain)
const tokenBalances = {};

/**
 * Get user token balance
 */
router.get('/balance/:address', (req, res) => {
    try {
        const address = req.params.address;
        const balance = tokenBalances[address] || 0;
        res.json({
            address,
            balance,
            formattedBalance: ethers.formatEther(balance)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reward blood donor
 */
router.post('/reward/blood-donor', restrictTo('admin', 'hospital', 'doctor'), async (req, res) => {
    try {
        const { donorAddress } = req.body;
        const REWARD_AMOUNT = ethers.parseEther('2'); // 2 tokens

        if (!tokenBalances[donorAddress]) {
            tokenBalances[donorAddress] = REWARD_AMOUNT;
        } else {
            tokenBalances[donorAddress] += REWARD_AMOUNT;
        }

        res.json({
            message: 'Blood donor rewarded',
            donorAddress,
            rewardAmount: '2 HRT',
            newBalance: ethers.formatEther(tokenBalances[donorAddress])
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reward organ donor
 */
router.post('/reward/organ-donor', restrictTo('admin', 'hospital', 'doctor'), async (req, res) => {
    try {
        const { donorAddress } = req.body;
        const REWARD_AMOUNT = ethers.parseEther('5'); // 5 tokens

        if (!tokenBalances[donorAddress]) {
            tokenBalances[donorAddress] = REWARD_AMOUNT;
        } else {
            tokenBalances[donorAddress] += REWARD_AMOUNT;
        }

        res.json({
            message: 'Organ donor rewarded',
            donorAddress,
            rewardAmount: '5 HRT',
            newBalance: ethers.formatEther(tokenBalances[donorAddress])
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reward patient assistance
 */
router.post('/reward/patient-assistance', restrictTo('admin', 'doctor'), async (req, res) => {
    try {
        const { patientAddress } = req.body;
        const REWARD_AMOUNT = ethers.parseEther('3'); // 3 tokens

        if (!tokenBalances[patientAddress]) {
            tokenBalances[patientAddress] = REWARD_AMOUNT;
        } else {
            tokenBalances[patientAddress] += REWARD_AMOUNT;
        }

        res.json({
            message: 'Patient rewarded',
            patientAddress,
            rewardAmount: '3 HRT',
            newBalance: ethers.formatEther(tokenBalances[patientAddress])
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Transfer tokens between users
 */
router.post('/transfer', async (req, res) => {
    try {
        const { fromAddress, toAddress, amount } = req.body;
        const transferAmount = ethers.parseEther(amount);

        if (!tokenBalances[fromAddress] || tokenBalances[fromAddress] < transferAmount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        tokenBalances[fromAddress] -= transferAmount;
        if (!tokenBalances[toAddress]) {
            tokenBalances[toAddress] = transferAmount;
        } else {
            tokenBalances[toAddress] += transferAmount;
        }

        res.json({
            message: 'Transfer successful',
            from: fromAddress,
            to: toAddress,
            amount,
            fromBalance: ethers.formatEther(tokenBalances[fromAddress]),
            toBalance: ethers.formatEther(tokenBalances[toAddress])
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get all token holders (admin view)
 */
router.get('/holders', restrictTo('admin'), (req, res) => {
    try {
        const holders = Object.entries(tokenBalances).map(([address, balance]) => ({
            address,
            balance,
            formattedBalance: ethers.formatEther(balance)
        }));

        res.json({
            totalHolders: holders.length,
            holders
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
