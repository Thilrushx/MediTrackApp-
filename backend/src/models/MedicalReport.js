const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const MedicalReport = sequelize.define('MedicalReport', {
  id:          { type: DataTypes.STRING, primaryKey: true },
  patientId:   { type: DataTypes.STRING, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  category:    { type: DataTypes.ENUM('Lab Result', 'Prescription', 'Imaging', 'Discharge Summary', 'Other'), defaultValue: 'Other' },
  filename:    { type: DataTypes.STRING, allowNull: false },
  originalName:{ type: DataTypes.STRING, allowNull: false },
  uploadedBy:  { type: DataTypes.STRING, allowNull: false },
  uploadedAt:  { type: DataTypes.STRING, allowNull: false },
}, { timestamps: false });

module.exports = MedicalReport;
