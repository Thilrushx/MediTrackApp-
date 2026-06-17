const service = require('../services/userService');

const getAll = async (req, res) => {
  try {
    const { role } = req.query;
    if (role) return res.json(await service.getByRole(role));
    res.json(await service.getAll());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { getAll };
