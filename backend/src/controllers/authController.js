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

module.exports = { login, getMe, logout, changePassword, resetPassword };
