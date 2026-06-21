/**
 * Migration + reseed script.
 * Adds missing columns to Users table then reseeds all data.
 *
 * Run: node src/migrate.js
 */
require('dotenv').config();
const bcrypt    = require('bcryptjs');
const sequelize = require('./database');
const { QueryInterface, DataTypes } = require('sequelize');

// Register all models
require('./models/User');
require('./models/Patient');
require('./models/Medication');
require('./models/AdherenceLog');
require('./models/EscalationAlert');
require('./models/PatientNote');
require('./models/MedicalReport');

const User         = require('./models/User');
const Patient      = require('./models/Patient');
const Medication   = require('./models/Medication');
const AdherenceLog = require('./models/AdherenceLog');
const EscalationAlert = require('./models/EscalationAlert');
const PatientNote  = require('./models/PatientNote');

async function addColumnIfMissing(table, column, definition) {
  const qi = sequelize.getQueryInterface();
  try {
    const cols = await qi.describeTable(table);
    if (!cols[column]) {
      await qi.addColumn(table, column, definition);
      console.log(`  ✅ Added column ${table}.${column}`);
    } else {
      console.log(`  ℹ️  Column ${table}.${column} already exists`);
    }
  } catch (e) {
    console.warn(`  ⚠️  Could not check/add ${table}.${column}:`, e.message);
  }
}

async function run() {
  await sequelize.authenticate();
  console.log('✅ DB connected\n');

  // ── 1. Ensure all required columns exist ───────────────────────────────────
  console.log('📐 Checking schema columns...');
  await addColumnIfMissing('Users', 'passwordHash', {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  });
  await addColumnIfMissing('Users', 'isActive', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
  await addColumnIfMissing('Patients', 'userId', {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });

  // ── 2. Wipe all data in dependency order ───────────────────────────────────
  console.log('\n🗑  Clearing tables...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const model of [AdherenceLog, EscalationAlert, PatientNote,
                        require('./models/MedicalReport'), Medication, Patient, User]) {
    await model.destroy({ where: {}, truncate: false });
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('  ✅ All tables cleared');

  // ── 3. Hash passwords ──────────────────────────────────────────────────────
  console.log('\n🔑 Hashing passwords...');
  const SALT = 12;
  const [docHash, cgv1Hash, cgv2Hash, cgv3Hash, pat1Hash, pat2Hash, pat3Hash] = await Promise.all([
    bcrypt.hash('Doctor@123',    SALT),
    bcrypt.hash('Caregiver@123', SALT),
    bcrypt.hash('Caregiver@456', SALT),
    bcrypt.hash('Caregiver@789', SALT),
    bcrypt.hash('Patient@123',   SALT),
    bcrypt.hash('Patient@456',   SALT),
    bcrypt.hash('Patient@789',   SALT),
  ]);
  console.log('  ✅ Done');

  // Verify hash works before inserting
  const testOk = await bcrypt.compare('Doctor@123', docHash);
  if (!testOk) throw new Error('bcrypt self-test failed — something is wrong with bcryptjs');
  console.log('  ✅ bcrypt self-test passed');

  // ── 4. Insert Users via raw query to bypass any model field filtering ──────
  console.log('\n👤 Inserting users via raw SQL...');
  await sequelize.query(
    `INSERT INTO Users (id, name, role, email, passwordHash, specialty, isActive)
     VALUES
       ('usr-doc-1', 'Dr. Evans',       'doctor',    'evans@meditrack.com',     :docHash,  'General & Cardiology', 1),
       ('usr-cgv-1', 'Sarah Peterson',  'caregiver', 'sarah.care@example.com',  :cgv1Hash, NULL, 1),
       ('usr-cgv-2', 'James Miller',    'caregiver', 'james.care@example.com',  :cgv2Hash, NULL, 1),
       ('usr-cgv-3', 'Michel Rose',     'caregiver', 'michel.care@example.com', :cgv3Hash, NULL, 1),
       ('usr-pat-1', 'William Johnson', 'patient',   'william@example.com',     :pat1Hash, NULL, 1),
       ('usr-pat-2', 'Margaret Lee',    'patient',   'margaret@example.com',    :pat2Hash, NULL, 1),
       ('usr-pat-3', 'Robert Chang',    'patient',   'robert@example.com',      :pat3Hash, NULL, 1)`,
    {
      replacements: { docHash, cgv1Hash, cgv2Hash, cgv3Hash, pat1Hash, pat2Hash, pat3Hash },
      type: sequelize.QueryTypes.INSERT,
    }
  );
  console.log('  ✅ Users inserted');

  // Verify it saved correctly
  const saved = await sequelize.query(
    `SELECT id, email, LENGTH(passwordHash) as hashLen FROM Users WHERE id = 'usr-doc-1'`,
    { type: sequelize.QueryTypes.SELECT }
  );
  console.log('  🔍 Verification — doctor hash length:', saved[0]?.hashLen);
  if (!saved[0]?.hashLen || saved[0].hashLen < 50) {
    throw new Error('passwordHash was not saved! Column may still be missing or wrong type.');
  }

  // ── 5. Insert Patients ─────────────────────────────────────────────────────
  console.log('\n🏥 Inserting patients...');
  await Patient.bulkCreate([
    { id: 'pat-1', name: 'William Johnson', age: 82, gender: 'Male',   condition: 'Diabetes, Hypertension', phone: '+1 (555) 100-2001', email: 'william@example.com',  doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1', userId: 'usr-pat-1' },
    { id: 'pat-2', name: 'Margaret Lee',    age: 74, gender: 'Female', condition: 'Cholesterol, Arthritis', phone: '+1 (555) 100-2002', email: 'margaret@example.com', doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-2', userId: 'usr-pat-2' },
    { id: 'pat-3', name: 'Robert Chang',    age: 68, gender: 'Male',   condition: 'Heart Disease',          phone: '+1 (555) 100-2003', email: 'robert@example.com',   doctorId: 'usr-doc-1', caregiverId: 'usr-cgv-1', userId: 'usr-pat-3' },
  ]);
  console.log('  ✅ Patients inserted');

  // ── 6. Insert Medications ──────────────────────────────────────────────────
  console.log('\n💊 Inserting medications...');
  const medications = [
    { id: 'med-1', patientId: 'pat-1', name: 'Metformin',    dosage: '500mg',   frequency: 'Twice daily',   times: ['08:00','20:00'], category: 'Diabetes',        startDate: '2026-01-10', notes: 'Take with meals.',             prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-2', patientId: 'pat-1', name: 'Lisinopril',   dosage: '10mg',    frequency: 'Daily',         times: ['08:00'],         category: 'Heart & Pressure', startDate: '2026-02-15', notes: 'Avoid grapefruit.',            prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-3', patientId: 'pat-1', name: 'Atorvastatin', dosage: '20mg',    frequency: 'Daily (Night)', times: ['21:00'],         category: 'Cholesterol',      startDate: '2026-02-15', notes: 'Take before sleeping.',        prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 019-9281' },
    { id: 'med-4', patientId: 'pat-1', name: 'Vitamin D3',   dosage: '1000 IU', frequency: 'Daily',         times: ['12:00'],         category: 'Vitamins',         startDate: '2025-11-01', notes: 'Support bone health.',         prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '' },
    { id: 'med-5', patientId: 'pat-2', name: 'Ibuprofen',    dosage: '400mg',   frequency: 'As needed',     times: ['08:00'],         category: 'Pain Relief',      startDate: '2026-03-01', notes: 'Take with food for arthritis.', prescribedBy: 'Dr. Evans', recipientEmail: 'james.care@example.com', recipientPhone: '+1 (555) 100-2002' },
    { id: 'med-6', patientId: 'pat-3', name: 'Warfarin',     dosage: '5mg',     frequency: 'Daily',         times: ['18:00'],         category: 'Heart & Pressure', startDate: '2026-01-20', notes: 'Monitor INR levels regularly.', prescribedBy: 'Dr. Evans', recipientEmail: 'sarah.care@example.com', recipientPhone: '+1 (555) 100-2003' },
  ];
  await Medication.bulkCreate(medications);
  console.log('  ✅ Medications inserted');

  // ── 7. Adherence logs ──────────────────────────────────────────────────────
  const dates = ['2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14'];
  const logs  = [];
  medications.filter(m => m.patientId === 'pat-1').forEach(med => {
    dates.forEach(d => {
      med.times.forEach(time => {
        let status = 'taken';
        if (d === '2026-06-13' && med.name === 'Metformin' && time === '20:00') status = 'missed';
        if (d === '2026-06-14' && parseInt(time.split(':')[0]) > 12)            status = 'pending';
        logs.push({
          id: `log-${med.id}-${d}-${time}`,
          medicationId: med.id, medicationName: med.name, dosage: med.dosage,
          scheduledTime: time, date: d, status,
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
    { id: 'note-1', date: '2026-06-12', noteText: 'Took Metformin in evening but felt mild nausea.',  sentiment: 'Neutral',      riskLevel: 'Low',    sideEffects: 'Mild nausea', riskAnalysis: 'Minor GI distress.',                     recommendations: 'Take with full meal.' },
    { id: 'note-2', date: '2026-06-13', noteText: 'Forgot morning Lisinopril, took it late at 2PM.', sentiment: 'Apprehensive', riskLevel: 'Medium', sideEffects: 'Headache',    riskAnalysis: 'Forgetting medication when leaving home.', recommendations: 'Set double alarm.' },
  ]);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ MIGRATION + RESEED COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Role       Email                        Password
  ─────────────────────────────────────────────────
  Doctor     evans@meditrack.com          Doctor@123
  Caregiver  sarah.care@example.com       Caregiver@123
  Caregiver  james.care@example.com       Caregiver@456
  Caregiver  michel.care@example.com      Caregiver@789
  Patient    william@example.com          Patient@123
  Patient    margaret@example.com         Patient@456
  Patient    robert@example.com           Patient@789
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
