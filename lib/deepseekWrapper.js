const { askDeepSeek } = require('./deepseekClient');

const prompt = process.argv.slice(2).join(' ');

if (!prompt) {
  console.log('Usage: node deepseekWrapper.js "Your prompt here"');
  process.exit(0);
}

(async () => {
  try {
    const result = await askDeepSeek(prompt);
    console.log(result);
  } catch (error) {
    // Error already logged by client
    process.exit(1);
  }
})();
