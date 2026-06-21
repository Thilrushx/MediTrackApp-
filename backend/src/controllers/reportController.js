const path    = require('path');
const service = require('../services/reportService');

const uploadDir = path.join(__dirname, '../../uploads');

const getAll = async (req, res) => {
  try {
    const { patientId } = req.query;
    const data = patientId
      ? await service.getByPatient(patientId)
      : await service.getAll();
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const create = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });
    const { patientId, name, category, uploadedBy } = req.body;
    if (!patientId || !name) return res.status(400).json({ error: 'patientId and name are required' });

    const report = await service.create({
      patientId,
      name,
      category:     category || 'Other',
      filename:     req.file.filename,
      originalName: req.file.originalname,
      uploadedBy:   req.user?.name || uploadedBy || 'Doctor',
    });
    res.status(201).json(report);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

const remove = async (req, res) => {
  try {
    const result = await service.remove(req.params.id);
    if (!result) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

const download = (req, res) => {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    res.download(filePath, (err) => {
      if (err) res.status(404).json({ error: 'File not found' });
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports = { getAll, create, remove, download };
