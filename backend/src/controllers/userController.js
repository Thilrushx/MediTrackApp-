const service = require('../services/userService');

// ── GET /api/users  (any authenticated user) ─────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { role } = req.query;
    if (role) return res.json(await service.getByRole(role));
    res.json(await service.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── GET /api/users/:id ────────────────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const user = await service.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── POST /api/users/caregivers  (doctor only) ─────────────────────────────────
const createCaregiver = async (req, res) => {
  try {
    const user = await service.createCaregiver(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── PUT /api/users/:id  (doctor only) ─────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const user = await service.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── PATCH /api/users/:id/active  (doctor only — toggle active status) ─────────
const setActive = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean.' });
    }
    const user = await service.setActive(req.params.id, isActive);
    res.json(user);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── DELETE /api/users/:id  (doctor only) ──────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const result = await service.deleteUser(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

module.exports = { getAll, getOne, createCaregiver, updateUser, setActive, deleteUser };
