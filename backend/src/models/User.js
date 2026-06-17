const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
  id:   { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('doctor', 'caregiver', 'patient'), allowNull: false },
  email:     { type: DataTypes.STRING },
  specialty: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = User;
