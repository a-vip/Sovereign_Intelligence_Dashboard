require('dotenv').config({ path: '.env.local' });
const { deleteEventPermanently } = require('./lib/db');

async function test() {
  try {
    const id = 'fdcc290378d4f0e04ae0078514da8fe1';
    const title = "We Updated Our Privacy Policy. Here's What Changed and Why.";
    console.log('Purging:', id);
    const result = await deleteEventPermanently(id, title, '');
    console.log('Result:', result);
  } catch (e) {
    console.error('Test failed:', e);
  }
}
test();
