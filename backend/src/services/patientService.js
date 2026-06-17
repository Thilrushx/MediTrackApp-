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
  return patient.update(data);
};

const remove = async (id) => {
  await Medication.destroy({ where: { patientId: id } });
  return Patient.destroy({ where: { id } });
};

module.exports = { getAll, getById, getByDoctor, getByCaregiver, create, update, remove };
