const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const EscalationAlert = sequelize.define('EscalationAlert', {
  id: { type: DataTypes.STRING, primaryKey: true },
  medicationId: { type: DataTypes.STRING },
  medicationName: { type: DataTypes.STRING, allowNull: false },
  scheduledTime: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  severity: { type: DataTypes.ENUM('medium', 'high'), defaultValue: 'high' },
  status: { type: DataTypes.ENUM('triggered', 'notified', 'resolved'), defaultValue: 'notified' },
  notifiedRole: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: false });

module.exports = EscalationAlert;
