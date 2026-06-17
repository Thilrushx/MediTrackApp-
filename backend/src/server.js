require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const sequelize = require('./database');

// ── Models ────────────────────────────────────────────────────────────────────
require('./models/User');
require('./models/Patient');
require('./models/Medication');
require('./models/AdherenceLog');
require('./models/EscalationAlert');
require('./models/PatientNote');
require('./models/MedicalReport');

// ── Routes ────────────────────────────────────────────────────────────────────
const userRoutes       = require('./routes/users');
const patientRoutes    = require('./routes/patients');
const medicationRoutes = require('./routes/medications');
const adherenceRoutes  = require('./routes/adherence');
const alertRoutes      = require('./routes/alerts');
const noteRoutes       = require('./routes/patientNotes');
const reportRoutes     = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS Policy ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// ── Request / Response Logger ─────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const DIM    = '\x1b[2m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

const statusColor = (code) => {
  if (code >= 500) return RED;
  if (code >= 400) return YELLOW;
  return GREEN;
};

app.use((req, res, next) => {
  const start = Date.now();
  const ts    = new Date().toISOString();

  res.on('finish', () => {
    const ms    = Date.now() - start;
    const color = statusColor(res.statusCode);
    console.log(
      `${DIM}[${ts}]${RESET} ` +
      `${BOLD}${CYAN}${req.method.padEnd(7)}${RESET} ` +
      `${req.originalUrl.padEnd(40)} ` +
      `${color}${BOLD}${res.statusCode}${RESET} ` +
      `${DIM}${ms}ms${RESET}`
    );
  });

  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/users',        userRoutes);
app.use('/api/patients',     patientRoutes);
app.use('/api/medications',  medicationRoutes);
app.use('/api/adherence',    adherenceRoutes);
app.use('/api/alerts',       alertRoutes);
app.use('/api/patient-notes', noteRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  console.warn(`${YELLOW}[404]${RESET} ${req.method} ${req.originalUrl} — route not found`);
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Seed ──────────────────────────────────────────────────────────────────────
const seed = async () => {
  const User          = require('./models/User');
  const Patient       = require('./models/Patient');
  const Medication    = require('./models/Medication');
  const AdherenceLog  = require('./models/AdherenceLog');
  const EscalationAlert = require('./models/EscalationAlert');
  const PatientNote   = require('./models/PatientNote');

  if (await User.count() > 0) return;

  // Users
  await User.bulkCreate([
    { id: 'usr-doc-1',  name: 'Dr. Evans',    role: 'doctor',    email: 'evans@meditrack.com',    specialty: 'General & Cardiology' },
    { id: 'usr-cgv-1',  name: 'Sarah Peterson', role: 'caregiver', email: 'sarah.care@example.com' },
    { id: 'usr-cgv-2',  name: 'James Miller',   role: 'caregiver', email: 'james.care@example.com' },
  ]);

  // Patients
  await Patient.bulkCreate([
    { id: 'pat-1', name: 'William Johnson', age: 82, gender: 'Male',   condition: 'Diabetes, Hypertension', phone: '+1 (555) 100-2001', email: 'william@example.com', doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1' },
    { id: 'pat-2', name: 'Margaret Lee',    age: 74, gender: 'Female', condition: 'Cholesterol, Arthritis', phone: '+1 (555) 100-2002', email: 'margaret@example.com', doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-2' },
    { id: 'pat-3', name: 'Robert Chang',    age: 68, gender: 'Male',   condition: 'Heart Disease',          phone: '+1 (555) 100-2003', email: 'robert@example.com',  doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1' },
  ]);

  // Medications
  const medications = [
    { id: 'med-1', patientId: 'pat-1', name: 'Metformin',    dosage: '500mg',    frequency: 'Twice daily',   times: ['08:00', '20:00'], category: 'Diabetes',        startDate: '2026-01-10', notes: 'Take with meals.',            prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-2', patientId: 'pat-1', name: 'Lisinopril',   dosage: '10mg',     frequency: 'Daily',         times: ['08:00'],          category: 'Heart & Pressure', startDate: '2026-02-15', notes: 'Avoid grapefruit.',           prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-3', patientId: 'pat-1', name: 'Atorvastatin', dosage: '20mg',     frequency: 'Daily (Night)', times: ['21:00'],          category: 'Cholesterol',      startDate: '2026-02-15', notes: 'Take before sleeping.',       prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-4', patientId: 'pat-1', name: 'Vitamin D3',   dosage: '1000 IU',  frequency: 'Daily',         times: ['12:00'],          category: 'Vitamins',         startDate: '2025-11-01', notes: 'Support bone health.',        prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '' },
    { id: 'med-5', patientId: 'pat-2', name: 'Ibuprofen',    dosage: '400mg',    frequency: 'As needed',     times: ['08:00'],          category: 'Pain Relief',      startDate: '2026-03-01', notes: 'Take with food for arthritis.',prescribedBy: 'Dr. Evans', recipientEmail: 'james.care@example.com', recipientPhone: '+1 (555) 100-2002' },
    { id: 'med-6', patientId: 'pat-3', name: 'Warfarin',     dosage: '5mg',      frequency: 'Daily',         times: ['18:00'],          category: 'Heart & Pressure', startDate: '2026-01-20', notes: 'Monitor INR levels regularly.',prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 100-2003' },
  ];
  await Medication.bulkCreate(medications);

  // Adherence logs for patient-1 last 5 days
  const dates = ['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-13', '2026-06-14'];
  const logs = [];
  medications.filter(m => m.patientId === 'pat-1').forEach((med) => {
    dates.forEach((d) => {
      med.times.forEach((time) => {
        let status = 'taken';
        if (d === '2026-06-13' && med.name === 'Metformin' && time === '20:00') status = 'missed';
        if (d === '2026-06-14' && parseInt(time.split(':')[0]) > 12) status = 'pending';
        logs.push({
          id: `log-${med.id}-${d}-${time}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          date: d,
          status,
          timestamp: status === 'taken' ? `${d}T${time}:12.000Z` : null,
        });
      });
    });
  });
  await AdherenceLog.bulkCreate(logs);

  await EscalationAlert.create({
    id: 'alert-1', medicationId: 'med-1', medicationName: 'Metformin',
    scheduledTime: '20:00', date: '2026-06-13', severity: 'high', status: 'notified',
    notifiedRole: 'Caregiver (Sarah)',
    message: 'ESCALATION: William missed Metformin (500mg) at 20:00. Caregiver Sarah notified.',
    timestamp: '2026-06-13T21:15:00.000Z',
  });

  await PatientNote.bulkCreate([
    { id: 'note-1', date: '2026-06-12', noteText: 'Took Metformin in evening but felt mild nausea.', sentiment: 'Neutral', riskLevel: 'Low', sideEffects: 'Mild nausea', riskAnalysis: 'Minor GI distress.', recommendations: 'Take with full meal.' },
    { id: 'note-2', date: '2026-06-13', noteText: 'Forgot morning Lisinopril, took it late at 2PM.', sentiment: 'Apprehensive', riskLevel: 'Medium', sideEffects: 'Headache', riskAnalysis: 'Forgetting medication when leaving home.', recommendations: 'Set double alarm.' },
  ]);

  console.log('✅ Seed data inserted.');
};

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  console.error(
    `${RED}${BOLD}[ERROR]${RESET} ` +
    `${req.method} ${req.originalUrl}\n` +
    `${RED}  ${err.message}${RESET}` +
    (err.stack ? `\n${DIM}${err.stack.split('\n').slice(1, 4).join('\n')}${RESET}` : '')
  );
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Unhandled promise rejections & uncaught exceptions ────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error(`${RED}${BOLD}[UNHANDLED REJECTION]${RESET}`, reason);
});

process.on('uncaughtException', (err) => {
  console.error(`${RED}${BOLD}[UNCAUGHT EXCEPTION]${RESET}`, err.message);
  console.error(DIM + err.stack + RESET);
  process.exit(1);
});

// ── Start ─────────────────────────────────────────────────────────────────────
sequelize
  .sync({ alter: true })
  .then(() => { console.log('✅ Database synced.'); return seed(); })
  .then(() => app.listen(PORT, () => console.log(`🚀 MediTrack API → http://localhost:${PORT}`)))
  .catch((err) => { console.error(`${RED}❌ Startup failed:${RESET}`, err.message); process.exit(1); });
