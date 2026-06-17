const service = require('../services/patientService');

// ── GET /api/patients ─────────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { doctorId, caregiverId } = req.query;

    // Patients can only see their own record
    if (req.user.role === 'patient') {
      const patient = await service.getById(req.user.patientId);
      return res.json(patient ? [patient] : []);
    }
    // Caregiver sees only their assigned patients
    if (req.user.role === 'caregiver') {
      return res.json(await service.getByCaregiver(req.user.id));
    }
    // Doctor can filter or see all
    if (doctorId)    return res.json(await service.getByDoctor(doctorId));
    if (caregiverId) return res.json(await service.getByCaregiver(caregiverId));
    res.json(await service.getAll());
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── GET /api/patients/:id ─────────────────────────────────────────────────────
const getById = async (req, res) => {
  try {
    const p = await service.getById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Patient not found.' });

    // Patients can only access their own record
    if (req.user.role === 'patient' && req.user.patientId !== p.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(p);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

// ── POST /api/patients  (doctor only) ────────────────────────────────────────
const create = async (req, res) => {
  try {
    // Inject the authenticated doctor's ID
    const result = await service.create({ ...req.body, doctorId: req.user.id });
    res.status(201).json(result);
  } catch (e) {
    res.status(e.status || 400).json({ error: e.message });
  }
};

// ── PUT /api/patients/:id  (doctor only) ─────────────────────────────────────
const update = async (req, res) => {
  try {
    const p = await service.update(req.params.id, req.body);
    res.json(p);
  } catch (e) {
    res.status(e.status || 400).json({ error: e.message });
  }
};

// ── DELETE /api/patients/:id  (doctor only) ───────────────────────────────────
const remove = async (req, res) => {
  try {
    const result = await service.remove(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
