process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

async function registerAndGetToken(user) {
  const response = await request(app).post('/api/auth/register').send(user);
  return response.body.token;
}

describe('Education APIs', () => {
  it('rejects support-program creation for non-admin users', async () => {
    const patientToken = await registerAndGetToken({
      email: 'patient-no-admin@example.com',
      password: 'password123',
      role: 'patient',
    });

    const response = await request(app)
      .post('/api/education/support-programs')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        providerType: 'central',
        provider: 'Central Government',
        badge: 'National Scheme',
        coverage: 60,
        programName: 'Blocked Program',
        support: 'Should not be created',
        link: 'https://example.com/blocked',
      });

    expect(response.status).toBe(403);
  });

  it('allows admin to create support programs', async () => {
    const token = await registerAndGetToken({
      email: 'admin-edu@example.com',
      password: 'password123',
      role: 'admin',
    });

    const response = await request(app)
      .post('/api/education/support-programs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerType: 'central',
        provider: 'Central Government',
        badge: 'National Scheme',
        coverage: 80,
        programName: 'Test Support Program',
        support: 'Support description',
        link: 'https://example.com',
        accessSteps: ['Step 1', 'Step 2'],
      });

    expect(response.status).toBe(201);
    expect(response.body.program.programName).toBe('Test Support Program');
  });

  it('allows admin to update and delete support programs', async () => {
    const token = await registerAndGetToken({
      email: 'admin-edu-update@example.com',
      password: 'password123',
      role: 'admin',
    });

    const created = await request(app)
      .post('/api/education/support-programs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerType: 'state',
        provider: 'State Government',
        badge: 'State Scheme',
        coverage: 40,
        programName: 'Editable Program',
        support: 'Initial support description',
        link: 'https://example.com/editable',
        accessSteps: ['Step 1'],
      });

    const updated = await request(app)
      .put(`/api/education/support-programs/${created.body.program._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        coverage: 65,
        support: 'Updated support description',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.program.coverage).toBe(65);

    const removed = await request(app)
      .delete(`/api/education/support-programs/${created.body.program._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removed.status).toBe(204);
  });

  it('allows patient to create women health reminders', async () => {
    const token = await registerAndGetToken({
      email: 'patient-edu@example.com',
      password: 'password123',
      role: 'patient',
    });

    const response = await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        language: 'en',
        stage: 'reproductive',
        goal: 'energy',
        reminderType: 'checkup',
        reminderDate: '2026-04-01T09:00:00.000Z',
        notes: 'Quarterly health check',
      });

    expect(response.status).toBe(201);
    expect(response.body.reminder.goal).toBe('energy');
  });

  it('allows reminder owner to update and delete a women health reminder', async () => {
    const token = await registerAndGetToken({
      email: 'patient-reminder-owner@example.com',
      password: 'password123',
      role: 'patient',
    });

    const created = await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        language: 'en',
        stage: 'teen',
        goal: 'cycle',
        reminderType: 'checkup',
        reminderDate: '2026-05-01T09:00:00.000Z',
        notes: 'Initial reminder',
      });

    const updated = await request(app)
      .put(`/api/education/women-reminders/${created.body.reminder._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        notes: 'Updated reminder note',
        goal: 'energy',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.reminder.goal).toBe('energy');

    const removed = await request(app)
      .delete(`/api/education/women-reminders/${created.body.reminder._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removed.status).toBe(204);
  });

  it('allows admin to update and delete another users reminder', async () => {
    const adminToken = await registerAndGetToken({
      email: 'admin-reminder-manager@example.com',
      password: 'password123',
      role: 'admin',
    });

    const patientToken = await registerAndGetToken({
      email: 'patient-reminder-managed@example.com',
      password: 'password123',
      role: 'patient',
    });

    const created = await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        language: 'en',
        stage: 'pregnancy',
        goal: 'bone',
        reminderType: 'visit',
        reminderDate: '2026-06-15T09:00:00.000Z',
        notes: 'Original patient reminder',
      });

    const updated = await request(app)
      .put(`/api/education/women-reminders/${created.body.reminder._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Admin updated this reminder',
        goal: 'nutrition',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.reminder.goal).toBe('nutrition');
    expect(updated.body.reminder.notes).toBe('Admin updated this reminder');

    const removed = await request(app)
      .delete(`/api/education/women-reminders/${created.body.reminder._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(removed.status).toBe(204);
  });

  it('limits reminder visibility for patients but allows admin to see and filter all reminders', async () => {
    const adminToken = await registerAndGetToken({
      email: 'admin-visibility@example.com',
      password: 'password123',
      role: 'admin',
    });

    const patientOneToken = await registerAndGetToken({
      email: 'patient-one@example.com',
      password: 'password123',
      role: 'patient',
    });

    const patientTwoToken = await registerAndGetToken({
      email: 'patient-two@example.com',
      password: 'password123',
      role: 'patient',
    });

    await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${patientOneToken}`)
      .send({
        language: 'en',
        stage: 'teen',
        goal: 'cycle',
        reminderType: 'checkup',
        reminderDate: '2026-07-01T09:00:00.000Z',
        notes: 'Patient one reminder',
      });

    await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${patientTwoToken}`)
      .send({
        language: 'en',
        stage: 'reproductive',
        goal: 'energy',
        reminderType: 'visit',
        reminderDate: '2026-07-02T09:00:00.000Z',
        notes: 'Patient two reminder',
      });

    const patientView = await request(app)
      .get('/api/education/women-reminders')
      .set('Authorization', `Bearer ${patientOneToken}`);

    expect(patientView.status).toBe(200);
    expect(patientView.body.reminders).toHaveLength(1);
    expect(patientView.body.reminders[0].patientEmail).toBe('patient-one@example.com');

    const adminView = await request(app)
      .get('/api/education/women-reminders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminView.status).toBe(200);
    expect(adminView.body.reminders).toHaveLength(2);

    const filteredAdminView = await request(app)
      .get('/api/education/women-reminders?patientEmail=patient-two@example.com')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(filteredAdminView.status).toBe(200);
    expect(filteredAdminView.body.reminders).toHaveLength(1);
    expect(filteredAdminView.body.reminders[0].patientEmail).toBe('patient-two@example.com');
  });

  it('returns admin analytics for education modules', async () => {
    const adminToken = await registerAndGetToken({
      email: 'admin-analytics@example.com',
      password: 'password123',
      role: 'admin',
    });

    const patientToken = await registerAndGetToken({
      email: 'patient-analytics@example.com',
      password: 'password123',
      role: 'patient',
    });

    await request(app)
      .post('/api/education/support-programs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        providerType: 'who',
        provider: 'WHO',
        badge: 'Global Guidance',
        coverage: 55,
        programName: 'WHO Support',
        support: 'Global health support',
        link: 'https://example.com/who',
        accessSteps: ['Step A'],
      });

    await request(app)
      .post('/api/education/women-reminders')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        language: 'en',
        stage: 'pregnancy',
        goal: 'bone',
        reminderType: 'visit',
        reminderDate: '2026-04-10T09:00:00.000Z',
        notes: 'Prenatal follow-up',
      });

    const response = await request(app)
      .get('/api/education/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.totals.supportPrograms).toBe(1);
    expect(response.body.totals.womenReminders).toBe(1);
  });

  it('rejects analytics requests from non-admin users', async () => {
    const patientToken = await registerAndGetToken({
      email: 'patient-analytics-blocked@example.com',
      password: 'password123',
      role: 'patient',
    });

    const response = await request(app)
      .get('/api/education/analytics')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(response.status).toBe(403);
  });
});
