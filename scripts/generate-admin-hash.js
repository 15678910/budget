// Usage: node scripts/generate-admin-hash.js <plaintext-password>
// Outputs: ADMIN_PASSWORD_HASH=<bcrypt-hash> to set as env var in Vercel

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.js <password>');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Error: Password must be at least 12 characters');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log('\nADMIN_PASSWORD_HASH=' + hash);
  console.log('\nNext steps:');
  console.log('  1. Copy the line above into Vercel > Settings > Environment Variables');
  console.log('     (set for Production + Preview + Development)');
  console.log('  2. Remove the old ADMIN_PASSWORD env var from Vercel');
  console.log('  3. Redeploy to apply the new variable');
  console.log('\nLocal dev: paste into .env.local (replace ADMIN_PASSWORD line)');
});
