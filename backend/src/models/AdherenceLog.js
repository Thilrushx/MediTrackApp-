const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const AdherenceLog = sequelize.define('AdherenceLog', {
  id: { type: DataTypes.STRING, primaryKey: true },
  medicationId: { type: DataTypes.STRING, allowNull: false },
  medicationName: { type: DataTypes.STRING, allowNull: false },
  dosage: { type: DataTypes.STRING, allowNull: false },
  scheduledTime: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.ENUM('taken', 'missed', 'pending'), defaultValue: 'pending' },
  timestamp: { type: DataTypes.STRING },
  patientNotes: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = AdherenceLog;
