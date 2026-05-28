const { getAiRegulations } = require('../lib/db');
require('dotenv').config({ path: '.env.local' });

async function main() {
  try {
    const regs = await getAiRegulations();
    console.log(`Total regulations in DB: ${regs.length}`);
    const taiwanRegs = regs.filter(r => 
      (r.title && r.title.toLowerCase().includes('taiwan')) || 
      (r.jurisdiction && r.jurisdiction.toLowerCase().includes('taiwan')) ||
      (r.description && r.description.toLowerCase().includes('taiwan'))
    );
    console.log('Taiwan regulations found:', JSON.stringify(taiwanRegs, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
