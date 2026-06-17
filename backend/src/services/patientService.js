const Patient      = require('../models/Patient');
const Medication   = require('../models/Medication');
const User         = require('../models/User');
const authService  = require('./authService');

// ── Queries ───────────────────────────────────────────────────────────────────

const getAll = () => Patient.findAll();

const getById = (id) => Patient.findByPk(id);

const getByDoctor = (doctorId) => Patient.findAll({ where: { doctorId } });

const getByCaregiver = (caregiverId) => Patient.findAll({ where: { caregiverId } });

// ── Create patient + login account atomically ─────────────────────────────────
/**
 * Creates both a Patient record and a User login account.
 * The doctor always supplies a temporary password; patient must change it on first login.
 *
 * Expected body: { name, age, gender, condition, phone, email, caregiverId, password, doctorId }
 */
const create = async (data) => {
  const { name, age, gender, condition, phone, email, caregiverId, password, doctorId } = data;

  if (!email) {
    throw Object.assign(new Error('Patient email is required to create a login account.'), { status: 400 });
  }
  if (!password) {
    throw Object.assign(new Error('An initial password is required for the patient login account.'), { status: 400 });
  }

  // Create the User login account first (throws on duplicate email)
  const userAccount = await authService.createUserAccount({
    name,
    email,
    password,
    role: 'patient',
  });

  // Now create the Patient clinical record, linked to the new User
  const patientId = `pat-${Date.now()}`;
  const patient = await Patient.create({
    id: patientId,
    name,
    age,
    gender: gender || 'Other',
    condition,
    phone,
    email,
    doctorId,
    caregiverId: caregiverId || null,
    userId: userAccount.id,
  });

  return { patient, userAccount };
};

// ── Update patient clinical record ────────────────────────────────────────────

const update = async (id, data) => {
  const patient = await Patient.findByPk(id);
  if (!patient) throw Object.assign(new Error('Patient not found.'), { status: 404 });

  const { name, age, gender, condition, phone, email, caregiverId } = data;
  await patient.update({ name, age, gender, condition, phone, email, caregiverId });

  // Keep linked User account name/email in sync
  if (patient.userId && (name || email)) {
    const user = await User.findByPk(patient.userId);
    if (user) {
      const userUpdates = {};
      if (name)  userUpdates.name  = name.trim();
      if (email) userUpdates.email = email.toLowerCase().trim();
      await user.update(userUpdates);
    }
  }

  return patient;
};

// ── Delete patient + their login account ─────────────────────────────────────

const remove = async (id) => {
  const AdherenceLog = require('../models/AdherenceLog');

  const patient = await Patient.findByPk(id);
  if (!patient) throw Object.assign(new Error('Patient not found.'), { status: 404 });

  // Cascade-delete medications and their adherence logs
  const meds = await Medication.findAll({ where: { patientId: id } });
  const medIds = meds.map(m => m.id);
  if (medIds.length) {
    await AdherenceLog.destroy({ where: { medicationId: medIds } });
    await Medication.destroy({ where: { patientId: id } });
  }

  // Delete the linked User login account
  if (patient.userId) {
    await User.destroy({ where: { id: patient.userId } });
  }

  await patient.destroy();
  return { message: 'Patient and associated login account deleted.' };
};

module.exports = { getAll, getById, getByDoctor, getByCaregiver, create, update, remove };
