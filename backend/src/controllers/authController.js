const authService = require('../services/authService');
const User        = require('../models/User');
const Patient     = require('../models/Patient');

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result); // { token, user }
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ── POST /api/auth/register  (doctor self-registration) ──────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, specialty, registerCode } = req.body;

    const DOCTOR_REGISTER_CODE = process.env.DOCTOR_REGISTER_CODE || 'MEDITRACK_DOCTOR_2026';
    if (registerCode !== DOCTOR_REGISTER_CODE) {
      return res.status(403).json({ error: 'Invalid registration code.' });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const bcrypt       = require('bcryptjs');
    const jwt          = require('jsonwebtoken');
    const passwordHash = await bcrypt.hash(password, 12);
    const id           = `usr-doc-${Date.now()}`;

    const user = await User.create({
      id, name: name.trim(), email: normalizedEmail,
      passwordHash, role: 'doctor',
      specialty: specialty?.trim() || null, isActive: true,
    });

    const SECRET  = process.env.JWT_SECRET || 'meditrack_dev_secret_change_in_prod';
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name, specialty: user.specialty, patientId: null };
    const token   = jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' });

    res.status(201).json({ token, user: payload });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ── GET /api/auth/me  (requires verifyToken) ──────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const data = user.toJSON();

    // Attach patientId for patient accounts
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ where: { userId: user.id } });
      data.patientId = patient ? patient.id : null;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT is stateless; logout is handled client-side by discarding the token.
// This endpoint exists for API completeness and audit logging.
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully.' });
};

// ── POST /api/auth/change-password  (requires verifyToken) ───────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
      req.user,
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ── POST /api/auth/reset-password/:userId  (doctor only) ─────────────────────
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const result = await authService.changePassword(
      req.params.userId,
      null,       // no current password — doctor override
      newPassword,
      req.user,   // performedBy (must be doctor)
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

module.exports = { login, register, getMe, logout, changePassword, resetPassword };
