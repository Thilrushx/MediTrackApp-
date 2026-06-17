const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Medication = sequelize.define('Medication', {
  id:             { type: DataTypes.STRING, primaryKey: true },
  patientId:      { type: DataTypes.STRING, allowNull: false },
  name:           { type: DataTypes.STRING, allowNull: false },
  dosage:         { type: DataTypes.STRING, allowNull: false },
  frequency:      { type: DataTypes.STRING, allowNull: false },
  times: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('times');
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(val) {
      this.setDataValue('times', Array.isArray(val) ? JSON.stringify(val) : val);
    },
  },
  category:       { type: DataTypes.STRING, allowNull: false },
  startDate:      { type: DataTypes.DATEONLY, allowNull: false },
  notes:          { type: DataTypes.TEXT },
  isActive:       { type: DataTypes.BOOLEAN, defaultValue: true },
  prescribedBy:   { type: DataTypes.STRING },
  recipientEmail: { type: DataTypes.STRING },
  recipientPhone: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = Medication;
