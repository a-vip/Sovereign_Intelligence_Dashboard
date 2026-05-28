require('dotenv').config({ path: '.env.local' });

async function main() {
  const { initDb, getUserByEmail } = await import('../lib/db.js');
  await initDb();
  const user = await getUserByEmail('workwithavip@gmail.com');
  console.log("=== Database User Entry for workwithavip@gmail.com ===");
  console.log(JSON.stringify(user, null, 2));
  process.exit(0);
}

main();
