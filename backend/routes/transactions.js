const express = require('express');
const { ethers } = require('ethers');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

function getProvider() {
  if (!process.env.RPC_URL) {
    throw new Error('RPC_URL is not configured');
  }
  return new ethers.JsonRpcProvider(process.env.RPC_URL);
}

router.get('/network', async (_req, res) => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    res.json({
      chainId: Number(network.chainId),
      networkName: network.name || process.env.BLOCKCHAIN_NETWORK || 'configured-rpc',
    });
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
});

router.get('/:txHash/status', async (req, res) => {
  try {
    const provider = getProvider();
    const tx = await provider.getTransaction(req.params.txHash);
    const receipt = await provider.getTransactionReceipt(req.params.txHash);

    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!receipt) {
      return res.json({ status: 'pending', txHash: req.params.txHash });
    }

    return res.json({
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      txHash: req.params.txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString() || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  '/estimate-gas',
  [
    body('txType').isString().trim().notEmpty(),
    body('patient').optional().isString(),
    body('ipfsHash').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const provider = getProvider();
      const feeData = await provider.getFeeData();

      let estimate = null;
      if (req.body.txType === 'medical-record-add' && req.body.patient && req.body.ipfsHash) {
        // Use ETH transfer gas floor as fallback estimate when method simulation is unavailable.
        estimate = '21000';
      }

      res.json({
        txType: req.body.txType,
        estimatedGas: estimate,
        maxFeePerGasWei: feeData.maxFeePerGas?.toString() || null,
        maxPriorityFeePerGasWei: feeData.maxPriorityFeePerGas?.toString() || null,
        gasPriceWei: feeData.gasPrice?.toString() || null,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
