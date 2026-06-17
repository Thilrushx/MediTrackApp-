const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      // Allows ALTER TABLE to run cleanly on existing rows that have
      // no timestamp values (avoids 0000-00-00 strict mode rejection)
      dateStrings: true,
      typeCast:    true,
      flags:       '-FOUND_ROWS',
    },
    define: {
      // Disable automatic createdAt / updatedAt on all models by default.
      // Models that need timestamps opt in explicitly with `timestamps: true`.
      timestamps: false,
      underscored: false,
    },
  }
);

module.exports = sequelize;
