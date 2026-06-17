const service = require('../services/patientService');

const getAll = async (req, res) => {
  try {
    const { doctorId, caregiverId } = req.query;
    if (doctorId)    return res.json(await service.getByDoctor(doctorId));
    if (caregiverId) return res.json(await service.getByCaregiver(caregiverId));
    res.json(await service.getAll());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const getById = async (req, res) => {
  try {
    const p = await service.getById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const create = async (req, res) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

const update = async (req, res) => {
  try {
    const p = await service.update(req.params.id, req.body);
    if (!p) return res.status(404).json({ error: 'Patient not found' });
    res.json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { getAll, getById, create, update, remove };
