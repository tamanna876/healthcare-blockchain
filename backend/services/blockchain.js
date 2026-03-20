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

function getBlockchainClients() {
  if (contracts) return contracts;

  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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

module.exports = { getBlockchainClients };
