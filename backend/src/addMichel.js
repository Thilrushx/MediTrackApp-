/**
 * One-time script — adds Michel Rose caregiver account.
 * Run: node src/addMichel.js
 */
require('dotenv').config();
const bcrypt    = require('bcryptjs');
const sequelize = require('./database');
require('./models/User');
const User = require('./models/User');

async function run() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  // Check if already exists
  const existing = await User.findOne({ where: { email: 'michel.care@example.com' } });
  if (existing) {
    console.log('⚠️  michel.care@example.com already exists. Updating password...');
    const passwordHash = await bcrypt.hash('Caregiver@789', 12);
    await sequelize.query(
      `UPDATE Users SET passwordHash = :hash WHERE email = 'michel.care@example.com'`,
      { replacements: { hash: passwordHash } }
    );
    console.log('✅ Password updated.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('Caregiver@789', 12);

  await sequelize.query(
    `INSERT INTO Users (id, name, role, email, passwordHash, specialty, isActive)
     VALUES ('usr-cgv-3', 'Michel Rose', 'caregiver', 'michel.care@example.com', :hash, NULL, 1)`,
    { replacements: { hash: passwordHash } }
  );

  // Verify
  const saved = await sequelize.query(
    `SELECT id, email, LENGTH(passwordHash) as hashLen FROM Users WHERE email = 'michel.care@example.com'`,
    { type: sequelize.QueryTypes.SELECT }
  );
  console.log('✅ Michel Rose inserted. Hash length:', saved[0]?.hashLen);

  // Test bcrypt
  const verify = await bcrypt.compare('Caregiver@789', passwordHash);
  console.log('✅ bcrypt verify:', verify);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email:    michel.care@example.com');
  console.log('  Password: Caregiver@789');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
