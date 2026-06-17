const Patient = require('../models/Patient');
const Medication = require('../models/Medication');

const getAll = () => Patient.findAll();

const getById = (id) => Patient.findByPk(id);

const getByDoctor = (doctorId) => Patient.findAll({ where: { doctorId } });

const getByCaregiver = (caregiverId) => Patient.findAll({ where: { caregiverId } });

const create = async (data) => {
  return Patient.create({ id: `pat-${Date.now()}`, ...data });
};

const update = async (id, data) => {
  const patient = await Patient.findByPk(id);
  if (!patient) return null;
  // Only allow safe fields — never overwrite id or doctorId
  const { name, age, gender, condition, phone, email, caregiverId } = data;
  return patient.update({ name, age, gender, condition, phone, email, caregiverId });
};

const remove = async (id) => {
  const AdherenceLog = require('../models/AdherenceLog');
  const meds = await Medication.findAll({ where: { patientId: id } });
  const medIds = meds.map(m => m.id);
  if (medIds.length) {
    await AdherenceLog.destroy({ where: { medicationId: medIds } });
    await Medication.destroy({ where: { patientId: id } });
  }
  return Patient.destroy({ where: { id } });
};

module.exports = { getAll, getById, getByDoctor, getByCaregiver, create, update, remove };
