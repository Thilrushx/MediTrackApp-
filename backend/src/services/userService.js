const User    = require('../models/User');
const Patient = require('../models/Patient');
const authService = require('./authService');

// ── Queries ───────────────────────────────────────────────────────────────────

const getAll = () =>
  User.findAll({ attributes: { exclude: ['passwordHash'] } });

const getByRole = (role) =>
  User.findAll({ where: { role }, attributes: { exclude: ['passwordHash'] } });

const getById = (id) =>
  User.findByPk(id, { attributes: { exclude: ['passwordHash'] } });

// ── Doctor: create caregiver account ─────────────────────────────────────────

const createCaregiver = async ({ name, email, password, specialty }) => {
  return authService.createUserAccount({ name, email, password, role: 'caregiver', specialty });
};

// ── Doctor: create patient login account (standalone, not linked to Patient row) ──
// Typically called FROM patientService.createPatient so both rows are created atomically.

const createPatientUser = async ({ name, email, password }) => {
  return authService.createUserAccount({ name, email, password, role: 'patient' });
};

// ── Doctor: update caregiver / patient user account ──────────────────────────

const updateUser = async (id, { name, email, specialty, isActive }) => {
  const user = await User.findByPk(id);
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
  if (user.role === 'doctor') {
    throw Object.assign(new Error('Doctor accounts cannot be modified via this endpoint.'), { status: 403 });
  }

  const updates = {};
  if (name      !== undefined) updates.name      = name.trim();
  if (email     !== undefined) updates.email     = email.toLowerCase().trim();
  if (specialty !== undefined) updates.specialty = specialty;
  if (isActive  !== undefined) updates.isActive  = isActive;

  // Check email uniqueness if changing it
  if (updates.email && updates.email !== user.email) {
    const existing = await User.findOne({ where: { email: updates.email } });
    if (existing) {
      throw Object.assign(new Error('Email already in use by another account.'), { status: 409 });
    }
  }

  await user.update(updates);
  const { passwordHash: _ph, ...safe } = user.toJSON();
  return safe;
};

// ── Doctor: deactivate / reactivate user ─────────────────────────────────────

const setActive = async (id, isActive) => {
  const user = await User.findByPk(id);
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
  if (user.role === 'doctor') {
    throw Object.assign(new Error('Cannot deactivate the doctor account.'), { status: 403 });
  }
  await user.update({ isActive });
  const { passwordHash: _ph, ...safe } = user.toJSON();
  return safe;
};

// ── Doctor: hard-delete caregiver / patient user ─────────────────────────────

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
  if (user.role === 'doctor') {
    throw Object.assign(new Error('Doctor accounts cannot be deleted.'), { status: 403 });
  }
  // Unlink any Patient row that references this userId
  await Patient.update({ userId: null }, { where: { userId: id } });
  await user.destroy();
  return { message: 'User account deleted.' };
};

module.exports = {
  getAll,
  getByRole,
  getById,
  createCaregiver,
  createPatientUser,
  updateUser,
  setActive,
  deleteUser,
};
