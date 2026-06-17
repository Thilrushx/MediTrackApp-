const service = require('../services/alertService');

const getAll = async (req, res) => {
  try {
    res.json(await service.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const resolve = async (req, res) => {
  try {
    const alert = await service.resolve(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getAll, resolve };
