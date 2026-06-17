const service = require('../services/medicationService');

const getAll = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (patientId) return res.json(await service.getByPatient(patientId));
    res.json(await service.getAll());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const create = async (req, res) => {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (e) { res.status(400).json({ error: e.message }); }
};

const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { getAll, create, remove };
