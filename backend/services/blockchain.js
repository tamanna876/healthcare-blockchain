const { ethers } = require('ethers');

// ABIs – kept minimal to just the functions we call
const MEDICAL_RECORDS_ABI = [
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

const BLOOD_DONATION_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'bloodGroup', type: 'string' },
      { internalType: 'string', name: 'location', type: 'string' },
    ],
    name: 'registerDonor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDonors',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'donorAddress', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'bloodGroup', type: 'string' },
          { internalType: 'string', name: 'location', type: 'string' },
        ],
        internalType: 'struct BloodDonation.Donor[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const ORGAN_DONATION_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'organ', type: 'string' },
      { internalType: 'string', name: 'bloodGroup', type: 'string' },
      { internalType: 'string', name: 'location', type: 'string' },
    ],
    name: 'registerDonor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDonors',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'donorAddress', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'organ', type: 'string' },
          { internalType: 'string', name: 'bloodGroup', type: 'string' },
          { internalType: 'string', name: 'location', type: 'string' },
        ],
        internalType: 'struct OrganDonation.Donor[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const MEDICINE_VERIFICATION_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'id', type: 'string' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'manufacturer', type: 'string' },
    ],
    name: 'registerMedicine',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'id', type: 'string' }],
    name: 'verifyMedicine',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
];

let provider, wallet, contracts;
let listenersInitialized = false;

async function isRpcEndpointReachable(rpcUrl) {
  if (!rpcUrl || typeof rpcUrl !== 'string') return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return false;
    const payload = await response.json();
    return typeof payload?.result === 'string';
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function hasValidPrivateKey(privateKey) {
  if (!privateKey || typeof privateKey !== 'string') return false;
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) return false;
  if (/^0x0{64}$/.test(privateKey)) return false;

  try {
    // Wallet constructor validates secp256k1 key range.
    // eslint-disable-next-line no-new
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

function getProvider() {
  if (provider) return provider;

  if (!process.env.RPC_URL) {
    throw new Error('RPC_URL is missing');
  }

  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  return provider;
}

function getBlockchainClients() {
  if (contracts) return contracts;

  const activeProvider = getProvider();
  if (!hasValidPrivateKey(process.env.PRIVATE_KEY)) {
    throw new Error('PRIVATE_KEY is not configured with a valid non-zero key');
  }

  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, activeProvider);

  contracts = {
    medicalRecords: new ethers.Contract(
      process.env.MEDICAL_RECORDS_ADDRESS,
      MEDICAL_RECORDS_ABI,
      wallet
    ),
    bloodDonation: new ethers.Contract(
      process.env.BLOOD_DONATION_ADDRESS,
      BLOOD_DONATION_ABI,
      wallet
    ),
    organDonation: new ethers.Contract(
      process.env.ORGAN_DONATION_ADDRESS,
      ORGAN_DONATION_ABI,
      wallet
    ),
    medicineVerification: new ethers.Contract(
      process.env.MEDICINE_VERIFICATION_ADDRESS,
      MEDICINE_VERIFICATION_ABI,
      wallet
    ),
  };

  return contracts;
}

function initializeBlockchainEventListeners() {
  if (listenersInitialized) return;

  if (!process.env.RPC_URL) {
    console.log('[Blockchain] Listener skipped: RPC_URL is not configured.');
    listenersInitialized = true;
    return;
  }

  listenersInitialized = true;

  void (async () => {
    const reachable = await isRpcEndpointReachable(process.env.RPC_URL);
    if (!reachable) {
      console.log('[Blockchain] Listener skipped: RPC endpoint is unreachable.');
      return;
    }

    try {
      const activeProvider = getProvider();
      activeProvider.on('block', (blockNumber) => {
        console.log(`[Blockchain] New block observed: ${blockNumber}`);
      });
      console.log('[Blockchain] Listener initialized (provider-only mode).');
    } catch (error) {
      console.warn('[Blockchain] Listener initialization skipped:', error.message);
    }
  })();
}

module.exports = { getBlockchainClients, initializeBlockchainEventListeners };
