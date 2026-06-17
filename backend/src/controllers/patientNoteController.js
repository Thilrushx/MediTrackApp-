const service = require('../services/patientNoteService');

const getAll = async (req, res) => {
  try {
    res.json(await service.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.noteText) return res.status(400).json({ error: 'noteText is required' });
    res.status(201).json(await service.create(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAll, create };
