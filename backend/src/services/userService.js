const User = require('../models/User');

const getAll = () => User.findAll();

const getByRole = (role) => User.findAll({ where: { role } });

const getById = (id) => User.findByPk(id);

module.exports = { getAll, getByRole, getById };
