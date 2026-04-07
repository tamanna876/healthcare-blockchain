require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { globalLimiter, authLimiter } = require('./middleware/rateLimit');
const { metricsMiddleware } = require('./services/telemetry');

// Route modules
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const donorRoutes = require('./routes/donors');
const medicineRoutes = require('./routes/medicines');
const trialRoutes = require('./routes/trials');
const prescriptionRoutes = require('./routes/prescriptions');
const recordRoutes = require('./routes/records');
const educationRoutes = require('./routes/education');
const adminRoutes = require('./routes/admin');
const emergencyRoutes = require('./routes/emergency');
const tokenRoutes = require('./routes/tokens');
const certificateRoutes = require('./routes/certificates');
const approvalRoutes = require('./routes/approvals');
const notificationRoutes = require('./routes/notifications');
const consentRoutes = require('./routes/consents');
const transactionRoutes = require('./routes/transactions');
const innovationRoutes = require('./routes/innovation');
const { initializeBlockchainEventListeners } = require('./services/blockchain');
const { seedInitialData } = require('./services/seed');
const { attachLiveAlertsHub } = require('./services/liveAlertsHub');

const app = express();

/* ─── Middleware ─────────────────────────────────────── */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/server requests and trusted local frontend origins.
    const isVercelPreview = typeof origin === 'string' && origin.endsWith('.vercel.app');
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(metricsMiddleware);

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Healthcare Blockchain Backend',
    docs: '/health',
  });
});

/* ─── Health check ───────────────────────────────────── */

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Healthcare Blockchain Backend' });
});

/* ─── API Routes ─────────────────────────────────────── */

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/innovation', innovationRoutes);

/* ─── Legacy route support (kept for backward compatibility) ─── */
// The old server.js had /addRecord and /records/:patient at the root
app.post('/addRecord', (req, res) => res.redirect(307, '/api/records'));
app.get('/records/:patient', (req, res) =>
  res.redirect(301, `/api/records/${req.params.patient}`)
);

/* ─── 404 handler ────────────────────────────────────── */

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/* ─── Global error handler ───────────────────────────── */

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

/* ─── Start server ───────────────────────────────────── */

async function start() {
  await connectDB();
  await seedInitialData();
  initializeBlockchainEventListeners();
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  attachLiveAlertsHub(server);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app; // exported for testing
