const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST    || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,

    dialectOptions: {
      // Prevents ALTER TABLE from failing on rows with no timestamp values
      dateStrings: true,
      typeCast:    true,
      // Allow Docker containers time to connect; increase connect timeout
      connectTimeout: 30000,
    },

    // Connection pool — sized for production containers
    pool: {
      max:     parseInt(process.env.DB_POOL_MAX  || '10', 10),
      min:     parseInt(process.env.DB_POOL_MIN  || '2',  10),
      acquire: parseInt(process.env.DB_POOL_ACQ  || '30000', 10),
      idle:    parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },

    define: {
      timestamps:  false,
      underscored: false,
    },
  }
);

/**
 * Retry connecting to the DB — essential in Docker where MySQL container
 * may not be ready when the app container starts.
 */
const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established.');
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⚠️  DB not ready (attempt ${attempt}/${retries}), retrying in ${delay / 1000}s…`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

module.exports = sequelize;
module.exports.connectWithRetry = connectWithRetry;
