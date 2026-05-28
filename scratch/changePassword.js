const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// PBKDF2 Hashing function matching lib/auth.js
function hashPassword(password) {
  if (!password) throw new Error('Password is required');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const newPassword = "admin123";
  const newHash = hashPassword(newPassword);
  console.log(`Hashing password "${newPassword}" -> ${newHash}`);

  // 1. Update local users-local.json if it exists
  const localUsersPath = path.resolve(__dirname, '../users-local.json');
  if (fs.existsSync(localUsersPath)) {
    console.log("Updating users-local.json...");
    try {
      const users = JSON.parse(fs.readFileSync(localUsersPath, 'utf8'));
      const idx = users.findIndex(u => u.email === 'workwithavip@gmail.com');
      if (idx !== -1) {
        users[idx].password_hash = newHash;
        users[idx].role = 'admin';
        fs.writeFileSync(localUsersPath, JSON.stringify(users, null, 2));
        console.log("✓ Successfully updated local users-local.json");
      } else {
        console.log("workwithavip@gmail.com not found in users-local.json");
      }
    } catch (e) {
      console.error("Error updating local JSON database:", e);
    }
  }

  // 2. Update PostgreSQL users table
  if (process.env.POSTGRES_URL) {
    console.log("Updating Postgres database...");
    try {
      const { sql } = require('@vercel/postgres');
      const res = await sql`UPDATE users SET password_hash = ${newHash}, role = 'admin', is_verified = TRUE WHERE email = 'workwithavip@gmail.com'`;
      console.log("✓ Successfully updated Postgres database user:", res);
    } catch (e) {
      console.error("Error updating Postgres database user:", e);
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
