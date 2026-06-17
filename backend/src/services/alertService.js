const EscalationAlert = require('../models/EscalationAlert');

const getAll = () => EscalationAlert.findAll({ order: [['timestamp', 'DESC']] });

const resolve = async (id) => {
  const alert = await EscalationAlert.findByPk(id);
  if (!alert) return null;
  alert.status = 'resolved';
  await alert.save();
  return alert;
};

module.exports = { getAll, resolve };
