const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto'); // node built-in via crypto.randomUUID()
const User      = require('../models/User');
const Patient   = require('../models/Patient');

const JWT_SECRET  = process.env.JWT_SECRET || 'meditrack_dev_secret_change_in_prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
const SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

const hashPassword = (plainText) => bcrypt.hash(plainText, SALT_ROUNDS);

const verifyPassword = (plainText, hash) => bcrypt.compare(plainText, hash);

const generateId = (prefix = 'usr') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ── Auth operations ───────────────────────────────────────────────────────────

/**
 * Authenticate a user by email + password.
 * Returns { token, user } on success; throws on failure.
 */
const login = async (email, password) => {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required.'), { status: 400 });
  }

  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    // Use a generic message to avoid email enumeration
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account is deactivated. Contact your doctor.'), { status: 403 });
  }

  const valid = await verifyPassword(password.trim(), user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }

  // If the user is a patient, attach their patientId for frontend data filtering
  let patientId = null;
  if (user.role === 'patient') {
    const patient = await Patient.findOne({ where: { userId: user.id } });
    if (patient) patientId = patient.id;
  }

  const payload = {
    id:        user.id,
    email:     user.email,
    role:      user.role,
    name:      user.name,
    specialty: user.specialty || null,
    patientId, // null for doctor/caregiver
  };

  const token = signToken(payload);

  return {
    token,
    user: payload,
  };
};

/**
 * Create a new user account (called by doctor for caregiver/patient accounts).
 * Returns the created User record (no passwordHash).
 */
const createUserAccount = async ({ name, email, password, role, specialty }) => {
  const allowedRoles = ['caregiver', 'patient'];
  if (!allowedRoles.includes(role)) {
    throw Object.assign(
      new Error(`Doctors can only create accounts with role: ${allowedRoles.join(', ')}.`),
      { status: 400 }
    );
  }

  if (!name || !email || !password) {
    throw Object.assign(new Error('Name, email, and password are required.'), { status: 400 });
  }

  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const id = generateId('usr');

  const user = await User.create({
    id,
    name:    name.trim(),
    email:   normalizedEmail,
    passwordHash,
    role,
    specialty: specialty || null,
    isActive: true,
  });

  const { passwordHash: _ph, ...safeUser } = user.toJSON();
  return safeUser;
};

/**
 * Change a user's password. Requires knowing the current password (or doctor override).
 */
const changePassword = async (userId, currentPassword, newPassword, performedBy) => {
  const user = await User.findByPk(userId);
  if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });

  // Doctor can reset any non-doctor password without knowing current password
  const isDoctorOverride = performedBy && performedBy.role === 'doctor' && user.role !== 'doctor';

  if (!isDoctorOverride) {
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Current password is incorrect.'), { status: 401 });
    }
  }

  if (newPassword.length < 8) {
    throw Object.assign(new Error('New password must be at least 8 characters.'), { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await user.update({ passwordHash });
  return { message: 'Password updated successfully.' };
};

module.exports = { login, createUserAccount, changePassword, hashPassword, generateId };
