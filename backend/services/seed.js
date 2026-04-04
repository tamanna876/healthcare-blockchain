const User = require('../models/User');
const Appointment = require('../models/Appointment');
const BloodDonor = require('../models/BloodDonor');
const OrganDonor = require('../models/OrganDonor');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const SupportProgram = require('../models/SupportProgram');

const demoUsers = [
  { email: 'patient@demo.com', password: 'password123', role: 'patient', displayName: 'Demo Patient' },
  { email: 'doctor@demo.com', password: 'password123', role: 'doctor', displayName: 'Demo Doctor' },
  { email: 'pharmacy@demo.com', password: 'password123', role: 'pharmacy', displayName: 'Demo Pharmacy' },
  { email: 'hospital@demo.com', password: 'password123', role: 'hospital', displayName: 'Demo Hospital' },
  { email: 'admin@demo.com', password: 'password123', role: 'admin', displayName: 'Demo Admin' },
];

const defaultSupportPrograms = [
  {
    providerType: 'state',
    provider: 'State Government',
    badge: 'State Scheme',
    coverage: 68,
    programName: 'MJPJAY - Maharashtra Health Scheme',
    support: 'Cashless treatment support for eligible families in empanelled hospitals.',
    link: 'https://www.jeevandayee.gov.in/',
    accessSteps: [
      'Check eligibility using ration or income documents.',
      'Visit nearest empanelled hospital or district help desk.',
      'Submit ID proof and scheme card to activate benefits.',
    ],
  },
  {
    providerType: 'state',
    provider: 'State Government',
    badge: 'State Scheme',
    coverage: 68,
    programName: 'CMCHIS - Tamil Nadu Insurance Scheme',
    support: 'Financial assistance for surgeries and major illnesses.',
    link: 'https://www.cmchistn.com/',
    accessSteps: [
      'Verify if your family card is linked to CMCHIS.',
      'Choose listed hospital from the official portal.',
      'Complete e-card verification at hospital support desk.',
    ],
  },
  {
    providerType: 'central',
    provider: 'Central Government',
    badge: 'National Scheme',
    coverage: 82,
    programName: 'Ayushman Bharat PM-JAY',
    support: 'Up to Rs 5 lakh annual family cover for hospitalization.',
    link: 'https://pmjay.gov.in/',
    accessSteps: [
      'Use beneficiary search on PM-JAY portal.',
      'Generate Ayushman card through CSC or hospital kiosk.',
      'Show card at empanelled hospital for cashless treatment.',
    ],
  },
  {
    providerType: 'central',
    provider: 'Central Government',
    badge: 'National Scheme',
    coverage: 82,
    programName: 'eSanjeevani Telemedicine',
    support: 'Free tele-consultation with doctors from home.',
    link: 'https://esanjeevani.mohfw.gov.in/',
    accessSteps: [
      'Open eSanjeevani and register with mobile number.',
      'Select OPD specialty and join queue.',
      'Download prescription after consultation.',
    ],
  },
  {
    providerType: 'who',
    provider: 'World Health Organization (WHO)',
    badge: 'Global Guidance',
    coverage: 55,
    programName: 'WHO India Health Campaigns',
    support: 'Trusted guidelines, vaccination campaigns, and outbreak alerts.',
    link: 'https://www.who.int/india',
    accessSteps: [
      'Visit WHO India portal for health advisories.',
      'Select disease or topic-specific program pages.',
      'Follow local partner links for implementation support.',
    ],
  },
  {
    providerType: 'who',
    provider: 'World Health Organization (WHO)',
    badge: 'Global Guidance',
    coverage: 55,
    programName: 'WHO Health Financing Guidance',
    support: 'Policy and citizen-facing information on equitable healthcare financing.',
    link: 'https://www.who.int/health-topics/health-financing',
    accessSteps: [
      'Open financing topic page and choose your concern.',
      'Read country guidance and downloadable toolkits.',
      'Use references to connect with local public health channels.',
    ],
  },
];

async function seedDemoUsers() {
  for (const user of demoUsers) {
    const existing = await User.findOne({ email: user.email });
    if (!existing) {
      await User.create(user);
    }
  }
}

async function seedSupportPrograms() {
  const count = await SupportProgram.countDocuments();
  if (count === 0) {
    await SupportProgram.insertMany(defaultSupportPrograms);
  }
}

async function seedAppointments(userMap) {
  const count = await Appointment.countDocuments();
  if (count > 0) return;

  await Appointment.insertMany([
    {
      patientEmail: 'patient@demo.com',
      patientId: userMap.patient?._id,
      doctor: 'Dr. Demo Doctor',
      date: '2026-03-20',
      time: '10:30 AM',
      reason: 'Quarterly cardiac review',
      status: 'Confirmed',
      notes: 'Bring recent blood test reports.',
    },
    {
      patientEmail: 'patient@demo.com',
      patientId: userMap.patient?._id,
      doctor: 'Dr. Demo Doctor',
      date: '2026-03-28',
      time: '03:15 PM',
      reason: 'Prescription adjustment follow-up',
      status: 'Scheduled',
      notes: 'Video consultation requested.',
    },
  ]);
}

async function seedBloodDonors() {
  const count = await BloodDonor.countDocuments();
  if (count > 0) return;

  await BloodDonor.insertMany([
    {
      name: 'Rahul Mehta',
      bloodGroup: 'O+',
      location: 'Mumbai, Maharashtra',
      phone: '+91-9000000001',
      email: 'patient@demo.com',
      donatedBefore: true,
      lastDonationDate: new Date('2025-12-15'),
      isAvailable: true,
    },
    {
      name: 'Anita Sharma',
      bloodGroup: 'A+',
      location: 'Pune, Maharashtra',
      phone: '+91-9000000002',
      email: 'hospital@demo.com',
      donatedBefore: false,
      isAvailable: true,
    },
  ]);
}

async function seedOrganDonors() {
  const count = await OrganDonor.countDocuments();
  if (count > 0) return;

  await OrganDonor.insertMany([
    {
      name: 'Sonia Kapoor',
      organType: 'Kidney',
      bloodGroup: 'B+',
      location: 'Delhi, NCR',
      phone: '+91-9000000003',
      email: 'patient@demo.com',
      isActive: true,
    },
    {
      name: 'Imran Khan',
      organType: 'Cornea',
      bloodGroup: 'O-',
      location: 'Hyderabad, Telangana',
      phone: '+91-9000000004',
      email: 'hospital@demo.com',
      isActive: true,
    },
  ]);
}

async function seedMedicines() {
  const count = await Medicine.countDocuments();
  if (count > 0) return;

  await Medicine.insertMany([
    {
      medicineId: 'MED-HT-1001',
      name: 'CardioSafe 10mg',
      manufacturer: 'Demo Pharma Labs',
      batchNumber: 'CARD-2026-01',
      manufactureDate: new Date('2026-01-05'),
      expiryDate: new Date('2028-01-05'),
      compositionTags: ['amlodipine', 'hypertension'],
      isVerified: true,
      txHash: '0xseededmedicine1',
    },
    {
      medicineId: 'MED-HT-1002',
      name: 'GlucoBalance 500mg',
      manufacturer: 'Demo Pharma Labs',
      batchNumber: 'GLUC-2026-02',
      manufactureDate: new Date('2026-02-10'),
      expiryDate: new Date('2028-02-10'),
      compositionTags: ['metformin', 'diabetes'],
      isVerified: true,
      txHash: '0xseededmedicine2',
    },
  ]);
}

async function seedPrescriptions(userMap) {
  const count = await Prescription.countDocuments();
  if (count > 0) return;

  await Prescription.insertMany([
    {
      patientEmail: 'patient@demo.com',
      patientId: userMap.patient?._id,
      issuedByDoctor: 'Demo Doctor',
      medication: 'CardioSafe 10mg',
      dosage: '1 tablet',
      frequency: 'Once daily',
      durationDays: 90,
      pharmacy: 'Demo Pharmacy Center',
      refillsAllowed: 3,
      refillsUsed: 1,
      status: 'Active',
      notes: 'Take after breakfast.',
    },
    {
      patientEmail: 'patient@demo.com',
      patientId: userMap.patient?._id,
      issuedByDoctor: 'Demo Doctor',
      medication: 'GlucoBalance 500mg',
      dosage: '1 tablet',
      frequency: 'Twice daily',
      durationDays: 60,
      pharmacy: 'Demo Pharmacy Center',
      refillsAllowed: 2,
      refillsUsed: 0,
      status: 'Requested',
      notes: 'Monitor fasting sugar weekly.',
    },
  ]);
}

async function seedInitialData() {
  // Only seed support programs for education hub.
  // Demo users removed: users create accounts with their own email/password.
  await seedSupportPrograms();
}

module.exports = { seedInitialData };