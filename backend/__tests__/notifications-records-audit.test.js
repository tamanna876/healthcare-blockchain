process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_test';

jest.mock('../services/blockchain', () => ({
  getBlockchainClients: () => ({
    medicalRecords: {
      getRecords: jest.fn(async () => [
        { ipfsHash: 'QmTestHash', doctor: '0xDoctorWallet', timestamp: 1712500000n },
      ]),
      addRecord: jest.fn(),
    },
  }),
  initializeBlockchainEventListeners: jest.fn(),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const ConsentGrant = require('../models/ConsentGrant');
const AuditLog = require('../models/AuditLog');
const SecureMedicalRecord = require('../models/SecureMedicalRecord');
const notificationService = require('../services/notifications');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
  notificationService.subscribers = {};
  notificationService.notifications = {};
  notificationService.notificationCounter = 0;
  notificationService.deliveryQueue = [];
  notificationService.processingQueue = false;
});

afterAll(async () => {
  await mongoose.connection.close();
});

async function registerUser({ email, role }) {
  const response = await request(app).post('/api/auth/register').send({
    email,
    password: 'password123',
    role,
  });

  return {
    token: response.body.token,
    user: response.body.user,
  };
}

describe('Notifications read-all endpoint', () => {
  it('marks all unread notifications as read for the authenticated user', async () => {
    const auth = await registerUser({ email: 'notify-user@example.com', role: 'patient' });

    const first = notificationService.publishNotification(
      'notify-user@example.com',
      'PRESCRIPTION',
      'Prescription ready',
      'You can collect your meds'
    );
    const second = notificationService.publishNotification(
      'notify-user@example.com',
      'APPOINTMENT',
      'Appointment reminder',
      'Consultation due tomorrow'
    );
    notificationService.markAsRead(first.id);

    const res = await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updated).toBe(1);

    const unread = await request(app)
      .get('/api/notifications/me?unreadOnly=true')
      .set('Authorization', `Bearer ${auth.token}`);

    expect(unread.status).toBe(200);
    expect(unread.body.total).toBe(0);
    expect(notificationService.notifications[second.id].read).toBe(true);
  });
});

describe('ConsentId audit metadata in record paths', () => {
  it('writes consentId in audit logs for secure read, secure verify, and record read', async () => {
    const patientAuth = await registerUser({ email: 'patient-owner@example.com', role: 'patient' });
    const doctorAuth = await registerUser({ email: 'doctor-reader@example.com', role: 'doctor' });

    const patientWallet = '0x1111111111111111111111111111111111111111';
    const patient = await User.findOneAndUpdate(
      { email: patientAuth.user.email },
      { walletAddress: patientWallet },
      { new: true }
    );

    const consent = await ConsentGrant.create({
      owner: patient._id,
      ownerEmail: patient.email,
      granteeType: 'doctor',
      granteeName: 'Doctor Reader',
      granteeIdentifier: 'doctor-reader@example.com',
      permissions: ['view-records'],
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const secureRecord = await SecureMedicalRecord.create({
      patient: patientWallet,
      ownerEmail: patient.email,
      encryptedPayload: { iv: 'x', encryptedData: 'y', authTag: 'z' },
      payloadHash: '123abc',
      ipfsHash: 'QmSecureHash',
      blockchainTxHash: '0xtxhash',
    });

    const secureReadRes = await request(app)
      .get(`/api/records/secure/${patientWallet}`)
      .set('Authorization', `Bearer ${doctorAuth.token}`);
    expect(secureReadRes.status).toBe(200);

    const secureReadAudit = await AuditLog.findOne({ action: 'SECURE_MEDICAL_RECORDS_VIEWED' }).sort({ createdAt: -1 });
    expect(secureReadAudit).toBeTruthy();
    expect(String(secureReadAudit.metadata.consentId)).toBe(String(consent._id));

    const secureVerifyRes = await request(app)
      .post(`/api/records/secure/${secureRecord._id}/verify`)
      .set('Authorization', `Bearer ${doctorAuth.token}`)
      .send({ payload: { symptoms: 'test' } });
    expect(secureVerifyRes.status).toBe(200);

    const secureVerifyAudit = await AuditLog.findOne({ action: 'SECURE_MEDICAL_RECORD_VERIFIED' }).sort({ createdAt: -1 });
    expect(secureVerifyAudit).toBeTruthy();
    expect(String(secureVerifyAudit.metadata.consentId)).toBe(String(consent._id));

    const recordReadRes = await request(app)
      .get(`/api/records/${patientWallet}`)
      .set('Authorization', `Bearer ${doctorAuth.token}`);
    expect(recordReadRes.status).toBe(200);
    expect(Array.isArray(recordReadRes.body.records)).toBe(true);

    const recordReadAudit = await AuditLog.findOne({ action: 'MEDICAL_RECORDS_VIEWED' }).sort({ createdAt: -1 });
    expect(recordReadAudit).toBeTruthy();
    expect(String(recordReadAudit.metadata.consentId)).toBe(String(consent._id));
  });
});

describe('Consent enforcement negative paths', () => {
  it('returns 403 for read and verify endpoints when consent is missing', async () => {
    const patientAuth = await registerUser({ email: 'patient-no-consent@example.com', role: 'patient' });
    const doctorAuth = await registerUser({ email: 'doctor-no-consent@example.com', role: 'doctor' });

    const patientWallet = '0x2222222222222222222222222222222222222222';
    const patient = await User.findOneAndUpdate(
      { email: patientAuth.user.email },
      { walletAddress: patientWallet },
      { new: true }
    );

    const secureRecord = await SecureMedicalRecord.create({
      patient: patientWallet,
      ownerEmail: patient.email,
      encryptedPayload: { iv: 'a', encryptedData: 'b', authTag: 'c' },
      payloadHash: 'hash-no-consent',
      ipfsHash: 'QmNoConsentHash',
      blockchainTxHash: '0xnoconsenttx',
    });

    const recordReadRes = await request(app)
      .get(`/api/records/${patientWallet}`)
      .set('Authorization', `Bearer ${doctorAuth.token}`);
    expect(recordReadRes.status).toBe(403);

    const secureReadRes = await request(app)
      .get(`/api/records/secure/${patientWallet}`)
      .set('Authorization', `Bearer ${doctorAuth.token}`);
    expect(secureReadRes.status).toBe(403);

    const verifyRes = await request(app)
      .post(`/api/records/secure/${secureRecord._id}/verify`)
      .set('Authorization', `Bearer ${doctorAuth.token}`)
      .send({ payload: { symptoms: 'blocked' } });
    expect(verifyRes.status).toBe(403);
  });

  it('returns 403 for verify endpoint when consent is expired', async () => {
    const patientAuth = await registerUser({ email: 'patient-expired-consent@example.com', role: 'patient' });
    const doctorAuth = await registerUser({ email: 'doctor-expired-consent@example.com', role: 'doctor' });

    const patientWallet = '0x3333333333333333333333333333333333333333';
    const patient = await User.findOneAndUpdate(
      { email: patientAuth.user.email },
      { walletAddress: patientWallet },
      { new: true }
    );

    await ConsentGrant.create({
      owner: patient._id,
      ownerEmail: patient.email,
      granteeType: 'doctor',
      granteeName: 'Expired Consent Doctor',
      granteeIdentifier: 'doctor-expired-consent@example.com',
      permissions: ['view-records'],
      status: 'active',
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const secureRecord = await SecureMedicalRecord.create({
      patient: patientWallet,
      ownerEmail: patient.email,
      encryptedPayload: { iv: 'old', encryptedData: 'old', authTag: 'old' },
      payloadHash: 'hash-expired-consent',
      ipfsHash: 'QmExpiredConsentHash',
      blockchainTxHash: '0xexpiredconsenttx',
    });

    const verifyRes = await request(app)
      .post(`/api/records/secure/${secureRecord._id}/verify`)
      .set('Authorization', `Bearer ${doctorAuth.token}`)
      .send({ payload: { symptoms: 'blocked-expired' } });

    expect(verifyRes.status).toBe(403);
  });
});

describe('End-to-end smoke flow', () => {
  it('runs login -> consent grant -> records read -> notify mark-all', async () => {
    await registerUser({ email: 'patient-smoke@example.com', role: 'patient' });
    await registerUser({ email: 'doctor-smoke@example.com', role: 'doctor' });

    const patientWallet = '0x4444444444444444444444444444444444444444';
    await User.findOneAndUpdate(
      { email: 'patient-smoke@example.com' },
      { walletAddress: patientWallet },
      { new: true }
    );

    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient-smoke@example.com', password: 'password123' });
    expect(patientLogin.status).toBe(200);

    const consentRes = await request(app)
      .post('/api/consents')
      .set('Authorization', `Bearer ${patientLogin.body.token}`)
      .send({
        granteeType: 'doctor',
        granteeName: 'Doctor Smoke',
        granteeIdentifier: 'doctor-smoke@example.com',
        permissions: ['view-records'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(consentRes.status).toBe(201);

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor-smoke@example.com', password: 'password123' });
    expect(doctorLogin.status).toBe(200);

    const recordsRes = await request(app)
      .get(`/api/records/${patientWallet}`)
      .set('Authorization', `Bearer ${doctorLogin.body.token}`);
    expect(recordsRes.status).toBe(200);
    expect(Array.isArray(recordsRes.body.records)).toBe(true);

    notificationService.publishNotification(
      'doctor-smoke@example.com',
      'APPOINTMENT',
      'Reminder one',
      'Appointment in 1 day'
    );
    notificationService.publishNotification(
      'doctor-smoke@example.com',
      'PRESCRIPTION',
      'Reminder two',
      'Prescription update pending'
    );

    const markAllRes = await request(app)
      .post('/api/notifications/read-all')
      .set('Authorization', `Bearer ${doctorLogin.body.token}`)
      .send({});
    expect(markAllRes.status).toBe(200);
    expect(markAllRes.body.success).toBe(true);

    const unreadRes = await request(app)
      .get('/api/notifications/me?unreadOnly=true')
      .set('Authorization', `Bearer ${doctorLogin.body.token}`);
    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.total).toBe(0);
  });
});
