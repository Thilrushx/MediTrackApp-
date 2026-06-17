/**
 * One-shot reseed script — wipes all Users and Patients then re-inserts them
 * with correctly hashed passwords. Run once after schema migration:
 *
 *   node src/reseed.js
 */
require('dotenv').config();
const bcrypt   = require('bcryptjs');
const sequelize = require('./database');

// Load models
require('./models/User');
require('./models/Patient');
require('./models/Medication');
require('./models/AdherenceLog');
require('./models/EscalationAlert');
require('./models/PatientNote');
require('./models/MedicalReport');

const User    = require('./models/User');
const Patient = require('./models/Patient');

const SALT = 12;

async function run() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  // Wipe in reverse FK order
  await require('./models/AdherenceLog').destroy({ where: {}, truncate: true });
  await require('./models/EscalationAlert').destroy({ where: {}, truncate: true });
  await require('./models/PatientNote').destroy({ where: {}, truncate: true });
  await require('./models/MedicalReport').destroy({ where: {}, truncate: true });
  await require('./models/Medication').destroy({ where: {}, truncate: true });
  await Patient.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });
  console.log('🗑  All tables cleared');

  const [docHash, cgv1Hash, cgv2Hash, pat1Hash, pat2Hash, pat3Hash] = await Promise.all([
    bcrypt.hash('Doctor@123',    SALT),
    bcrypt.hash('Caregiver@123', SALT),
    bcrypt.hash('Caregiver@456', SALT),
    bcrypt.hash('Patient@123',   SALT),
    bcrypt.hash('Patient@456',   SALT),
    bcrypt.hash('Patient@789',   SALT),
  ]);
  console.log('🔑 Passwords hashed');

  await User.bulkCreate([
    { id: 'usr-doc-1',  name: 'Dr. Evans',       role: 'doctor',    email: 'evans@meditrack.com',       passwordHash: docHash,  specialty: 'General & Cardiology', isActive: true },
    { id: 'usr-cgv-1',  name: 'Sarah Peterson',  role: 'caregiver', email: 'sarah.care@example.com',    passwordHash: cgv1Hash, isActive: true },
    { id: 'usr-cgv-2',  name: 'James Miller',    role: 'caregiver', email: 'james.care@example.com',    passwordHash: cgv2Hash, isActive: true },
    { id: 'usr-pat-1',  name: 'William Johnson', role: 'patient',   email: 'william@example.com',       passwordHash: pat1Hash, isActive: true },
    { id: 'usr-pat-2',  name: 'Margaret Lee',    role: 'patient',   email: 'margaret@example.com',      passwordHash: pat2Hash, isActive: true },
    { id: 'usr-pat-3',  name: 'Robert Chang',    role: 'patient',   email: 'robert@example.com',        passwordHash: pat3Hash, isActive: true },
  ]);
  console.log('👤 Users created');

  await Patient.bulkCreate([
    { id: 'pat-1', name: 'William Johnson', age: 82, gender: 'Male',   condition: 'Diabetes, Hypertension', phone: '+1 (555) 100-2001', email: 'william@example.com',  doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1', userId: 'usr-pat-1' },
    { id: 'pat-2', name: 'Margaret Lee',    age: 74, gender: 'Female', condition: 'Cholesterol, Arthritis', phone: '+1 (555) 100-2002', email: 'margaret@example.com', doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-2', userId: 'usr-pat-2' },
    { id: 'pat-3', name: 'Robert Chang',    age: 68, gender: 'Male',   condition: 'Heart Disease',          phone: '+1 (555) 100-2003', email: 'robert@example.com',   doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1', userId: 'usr-pat-3' },
  ]);
  console.log('🏥 Patients created');

  const Medication = require('./models/Medication');
  const medications = [
    { id: 'med-1', patientId: 'pat-1', name: 'Metformin',    dosage: '500mg',   frequency: 'Twice daily',   times: ['08:00','20:00'], category: 'Diabetes',        startDate: '2026-01-10', notes: 'Take with meals.',             prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-2', patientId: 'pat-1', name: 'Lisinopril',   dosage: '10mg',    frequency: 'Daily',         times: ['08:00'],         category: 'Heart & Pressure', startDate: '2026-02-15', notes: 'Avoid grapefruit.',            prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-3', patientId: 'pat-1', name: 'Atorvastatin', dosage: '20mg',    frequency: 'Daily (Night)', times: ['21:00'],         category: 'Cholesterol',      startDate: '2026-02-15', notes: 'Take before sleeping.',        prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-4', patientId: 'pat-1', name: 'Vitamin D3',   dosage: '1000 IU', frequency: 'Daily',         times: ['12:00'],         category: 'Vitamins',         startDate: '2025-11-01', notes: 'Support bone health.',         prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '' },
    { id: 'med-5', patientId: 'pat-2', name: 'Ibuprofen',    dosage: '400mg',   frequency: 'As needed',     times: ['08:00'],         category: 'Pain Relief',      startDate: '2026-03-01', notes: 'Take with food for arthritis.', prescribedBy: 'Dr. Evans', recipientEmail: 'james.care@example.com', recipientPhone: '+1 (555) 100-2002' },
    { id: 'med-6', patientId: 'pat-3', name: 'Warfarin',     dosage: '5mg',     frequency: 'Daily',         times: ['18:00'],         category: 'Heart & Pressure', startDate: '2026-01-20', notes: 'Monitor INR levels regularly.', prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 100-2003' },
  ];
  await Medication.bulkCreate(medications);
  console.log('💊 Medications created');

  const AdherenceLog = require('./models/AdherenceLog');
  const dates = ['2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14'];
  const logs  = [];
  medications.filter(m => m.patientId === 'pat-1').forEach(med => {
    dates.forEach(d => {
      med.times.forEach(time => {
        let status = 'taken';
        if (d === '2026-06-13' && med.name === 'Metformin' && time === '20:00') status = 'missed';
        if (d === '2026-06-14' && parseInt(time.split(':')[0]) > 12)            status = 'pending';
        logs.push({ id: `log-${med.id}-${d}-${time}`, medicationId: med.id, medicationName: med.name, dosage: med.dosage, scheduledTime: time, date: d, status, timestamp: status === 'taken' ? `${d}T${time}:12.000Z` : null });
      });
    });
  });
  await AdherenceLog.bulkCreate(logs);

  await require('./models/EscalationAlert').create({
    id: 'alert-1', medicationId: 'med-1', medicationName: 'Metformin',
    scheduledTime: '20:00', date: '2026-06-13', severity: 'high', status: 'notified',
    notifiedRole: 'Caregiver (Sarah)',
    message: 'ESCALATION: William missed Metformin (500mg) at 20:00. Caregiver Sarah notified.',
    timestamp: '2026-06-13T21:15:00.000Z',
  });

  await require('./models/PatientNote').bulkCreate([
    { id: 'note-1', date: '2026-06-12', noteText: 'Took Metformin in evening but felt mild nausea.',      sentiment: 'Neutral',      riskLevel: 'Low',    sideEffects: 'Mild nausea', riskAnalysis: 'Minor GI distress.',                     recommendations: 'Take with full meal.' },
    { id: 'note-2', date: '2026-06-13', noteText: 'Forgot morning Lisinopril, took it late at 2PM.',     sentiment: 'Apprehensive', riskLevel: 'Medium', sideEffects: 'Headache',    riskAnalysis: 'Forgetting medication when leaving home.', recommendations: 'Set double alarm.' },
  ]);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ RESEED COMPLETE — DEMO CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Doctor    evans@meditrack.com       Doctor@123
  Caregiver sarah.care@example.com    Caregiver@123
  Caregiver james.care@example.com    Caregiver@456
  Patient   william@example.com       Patient@123
  Patient   margaret@example.com      Patient@456
  Patient   robert@example.com        Patient@789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Reseed failed:', err.message);
  process.exit(1);
});
