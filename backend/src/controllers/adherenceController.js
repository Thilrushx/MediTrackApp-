const service = require('../services/adherenceService');

const getAll = async (req, res) => {
  try {
    res.json(await service.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const takeDose = async (req, res) => {
  try {
    res.json(await service.takeDose(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const missDose = async (req, res) => {
  try {
    res.json(await service.missDose(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

module.exports = { getAll, takeDose, missDose };
