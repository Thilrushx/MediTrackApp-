const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
  id:           { type: DataTypes.STRING, primaryKey: true },
  name:         { type: DataTypes.STRING, allowNull: false },
  role:         { type: DataTypes.ENUM('doctor', 'caregiver', 'patient'), allowNull: false },
  email:        { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: true },
  specialty:    { type: DataTypes.STRING },
  isActive:     { type: DataTypes.BOOLEAN, defaultValue: true },
}, { timestamps: false });

module.exports = User;
