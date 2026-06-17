const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PatientNote = sequelize.define('PatientNote', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  noteText: { type: DataTypes.TEXT, allowNull: false },
  sentiment: { type: DataTypes.STRING },
  riskLevel: { type: DataTypes.ENUM('Low', 'Medium', 'High') },
  riskAnalysis: { type: DataTypes.TEXT },
  sideEffects: { type: DataTypes.STRING },
  recommendations: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = PatientNote;
