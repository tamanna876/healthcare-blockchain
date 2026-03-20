/**
 * Backend integration tests for auth routes.
 * These run with Jest + Supertest.
 * MongoDB is mocked via an in-memory connection (uses the real Mongoose but with TEST_DB).
 *
 * To run: cd backend && npm test
 */

process.env.JWT_SECRET = 'test_secret'
process.env.JWT_EXPIRES_IN = '1h'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/healthcare_test'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../index')

// Connect to test DB before all tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
})

// Clean up between tests
afterEach(async () => {
  await mongoose.connection.db.dropDatabase()
})

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.close()
})

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', role: 'patient' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user.role).toBe('patient')
  })

  it('rejects duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'anotherpass' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/already registered/i)
  })

  it('validates email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'secret123', role: 'doctor' })
  })

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpass' })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'pass1234', role: 'admin' })

    const token = reg.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('me@example.com')
  })

  it('rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('GET /health', () => {
  it('responds with ok status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
