const Medication = require('../models/Medication');
const AdherenceLog = require('../models/AdherenceLog');

const getAll = () => Medication.findAll();

const getByPatient = (patientId) => Medication.findAll({ where: { patientId } });

const getById = (id) => Medication.findByPk(id);

const create = async (data) => {
  const id = `med-${Date.now()}`;
  const med = await Medication.create({ id, ...data, isActive: true });

  const today = new Date().toISOString().split('T')[0];
  const logs = (data.times || []).map((time) => ({
    id: `log-${id}-${today}-${time}`,
    medicationId: id,
    medicationName: med.name,
    dosage: med.dosage,
    scheduledTime: time,
    date: today,
    status: 'pending',
  }));
  if (logs.length) await AdherenceLog.bulkCreate(logs);

  return med;
};

const remove = async (id) => {
  await AdherenceLog.destroy({ where: { medicationId: id } });
  return Medication.destroy({ where: { id } });
};

module.exports = { getAll, getByPatient, getById, create, remove };
