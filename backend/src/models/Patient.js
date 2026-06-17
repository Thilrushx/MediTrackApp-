const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Patient = sequelize.define('Patient', {
  id:          { type: DataTypes.STRING, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  age:         { type: DataTypes.INTEGER, allowNull: false },
  gender:      { type: DataTypes.ENUM('Male', 'Female', 'Other'), defaultValue: 'Other' },
  condition:   { type: DataTypes.STRING },
  phone:       { type: DataTypes.STRING },
  email:       { type: DataTypes.STRING },
  doctorId:    { type: DataTypes.STRING },
  caregiverId: { type: DataTypes.STRING },
}, { timestamps: false });

module.exports = Patient;
