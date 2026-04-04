require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route modules
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const donorRoutes = require('./routes/donors');
const medicineRoutes = require('./routes/medicines');
const trialRoutes = require('./routes/trials');
const prescriptionRoutes = require('./routes/prescriptions');
const recordRoutes = require('./routes/records');
const educationRoutes = require('./routes/education');
const { seedInitialData } = require('./services/seed');

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
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Health check ───────────────────────────────────── */

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Healthcare Blockchain Backend' });
});

/* ─── API Routes ─────────────────────────────────────── */

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/trials', trialRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/education', educationRoutes);

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
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app; // exported for testing
