const fs            = require('fs');
const path          = require('path');
const MedicalReport = require('../models/MedicalReport');

const uploadDir = path.join(__dirname, '../../uploads');

const getAll = () => MedicalReport.findAll({ order: [['uploadedAt', 'DESC']] });

const getByPatient = (patientId) =>
  MedicalReport.findAll({ where: { patientId }, order: [['uploadedAt', 'DESC']] });

const create = async ({ patientId, name, category, filename, originalName, uploadedBy }) => {
  return MedicalReport.create({
    id:           `rep-${Date.now()}`,
    patientId,
    name,
    category,
    filename,
    originalName,
    uploadedBy,
    uploadedAt:   new Date().toISOString(),
  });
};

const remove = async (id) => {
  const report = await MedicalReport.findByPk(id);
  if (!report) return null;
  // Delete physical file
  const filePath = path.join(uploadDir, report.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await report.destroy();
  return true;
};

module.exports = { getAll, getByPatient, create, remove };
