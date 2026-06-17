/**
 * Debug script — run with: node src/debugauth.js
 * Prints the stored hash and tests bcrypt.compare directly.
 */
require('dotenv').config();
const bcrypt    = require('bcryptjs');
const sequelize = require('./database');
require('./models/User');
const User = require('./models/User');

async function run() {
  await sequelize.authenticate();

  const user = await User.findOne({ where: { email: 'evans@meditrack.com' } });

  if (!user) {
    console.log('❌ User NOT found in database. The reseed did not work.');
    process.exit(1);
  }

  console.log('✅ User found:');
  console.log('   id:          ', user.id);
  console.log('   email:       ', user.email);
  console.log('   isActive:    ', user.isActive);
  console.log('   passwordHash:', user.passwordHash);
  console.log('   hash length: ', user.passwordHash?.length);

  const isValid = await bcrypt.compare('Doctor@123', user.passwordHash);
  console.log('\nbcrypt.compare("Doctor@123", hash) =>', isValid);

  if (!isValid) {
    // Try hashing fresh and see what we get
    const fresh = await bcrypt.hash('Doctor@123', 12);
    console.log('\nFreshly generated hash for Doctor@123:');
    console.log(fresh);
    console.log('\nStored hash:');
    console.log(user.passwordHash);
    console.log('\n→ These should both start with $2b$12$ if bcryptjs is working correctly.');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
