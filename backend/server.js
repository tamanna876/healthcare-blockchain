require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { ethers } = require('ethers');
const { create } = require('ipfs-http-client');

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.MEDICAL_RECORDS_ADDRESS;

const upload = multer({ dest: 'uploads/' });

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const ipfs = create({
  host: process.env.IPFS_HOST || 'ipfs.infura.io',
  port: Number(process.env.IPFS_PORT || 5001),
  protocol: process.env.IPFS_PROTOCOL || 'https',
});

const abi = [
  {
    inputs: [
      { internalType: 'address', name: 'patient', type: 'address' },
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
    ],
    name: 'addRecord',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'patient', type: 'address' }],
    name: 'getRecords',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'ipfsHash', type: 'string' },
          { internalType: 'address', name: 'doctor', type: 'address' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct MedicalRecords.Record[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const blockchain = {
  enabled: false,
  reason: 'Blockchain not configured',
  contract: null,
};

async function initializeBlockchain() {
  if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    blockchain.enabled = false;
    blockchain.reason = 'Missing RPC_URL, PRIVATE_KEY, or MEDICAL_RECORDS_ADDRESS';
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    await provider.getBlockNumber();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

    blockchain.enabled = true;
    blockchain.reason = 'Connected';
    blockchain.contract = contract;
  } catch (error) {
    blockchain.enabled = false;
    blockchain.reason = `RPC unavailable: ${error.message}`;
    blockchain.contract = null;
  }
}

function requireBlockchain(req, res, next) {
  if (!blockchain.enabled || !blockchain.contract) {
    return res.status(503).json({
      error: 'Blockchain service unavailable',
      details: blockchain.reason,
    });
  }
  return next();
}

app.get('/', (_req, res) => {
  res.send('Healthcare Blockchain Backend Running');
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Healthcare Blockchain Backend',
    blockchain: {
      enabled: blockchain.enabled,
      reason: blockchain.reason,
    },
  });
});

app.get('/upload-page', (_req, res) => {
  res.send(`
    <h2>Upload Medical File</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const result = await ipfs.add(fileBuffer);

    return res.status(200).json({
      message: 'File uploaded to IPFS',
      ipfsHash: result.path,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

app.post('/addRecord', requireBlockchain, async (req, res) => {
  try {
    const { patient, ipfsHash } = req.body;
    if (!patient || !ipfsHash) {
      return res.status(400).json({ error: 'patient and ipfsHash are required' });
    }

    const tx = await blockchain.contract.addRecord(patient, ipfsHash);
    await tx.wait();

    return res.status(200).json({
      message: 'Medical record added successfully',
      transactionHash: tx.hash,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/records/:patient', requireBlockchain, async (req, res) => {
  try {
    const records = await blockchain.contract.getRecords(req.params.patient);
    const formatted = records.map((record) => ({
      ipfsHash: record.ipfsHash,
      doctor: record.doctor,
      timestamp: record.timestamp.toString(),
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function start() {
  await initializeBlockchain();
  if (blockchain.enabled) {
    console.log('Blockchain connected');
  } else {
    console.warn(`Blockchain disabled: ${blockchain.reason}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
